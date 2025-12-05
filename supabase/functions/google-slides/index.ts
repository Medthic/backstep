// @ts-ignore - Deno imports work at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports work at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlideData {
  slideId: string
  imageUrl: string
  pageNumber: number
}

// @ts-ignore - Deno serve function signature
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function called, method:', req.method)
    
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('Request body:', requestBody)
    } catch (e) {
      throw new Error(`Failed to parse request body: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    
    const { presentationId } = requestBody
    
    if (!presentationId) {
      throw new Error('presentationId is required')
    }

    console.log('Processing presentation ID:', presentationId)

    // Initialize Supabase client - try different environment variable names
    // @ts-ignore - Deno.env available at runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://lhprwuhcbqkdxgpftbmo.supabase.co'
    // @ts-ignore - Deno.env available at runtime
    let supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 
                      // @ts-ignore
                      Deno.env.get('SUPABASE_SERVICE_KEY') ?? 
                      // @ts-ignore
                      Deno.env.get('SERVICE_ROLE_KEY') ?? 
                      // @ts-ignore
                      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl.length,
      keyLength: supabaseKey.length,
      // @ts-ignore - Deno.env available at runtime
      availableEnvVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('SUPABASE'))
    })

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable not found')
    }
    
    if (!supabaseKey) {
      throw new Error('No Supabase key environment variable found')
    }

    // Initialize Supabase client 
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching service account credentials...')

    // Fetch service account credentials from Supabase
    const { data: credData, error: credError } = await supabaseClient
      .from('google_service_account')
      .select('credentials')
      .single()

    if (credError) {
      console.error('Database error:', credError)
      throw new Error(`Failed to fetch credentials: ${credError.message}`)
    }

    if (!credData || !credData.credentials) {
      throw new Error('No credentials found in database')
    }

    console.log('Credentials fetched successfully')
    const credentials = credData.credentials

    // Validate credentials structure
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid credentials format - missing client_email or private_key')
    }

    console.log('Service account email:', credentials.client_email)
    console.log('Private key format check:', {
      hasBeginMarker: credentials.private_key.includes('-----BEGIN'),
      keyLength: credentials.private_key.length,
      startsWithDashes: credentials.private_key.startsWith('-----')
    })

    console.log('Getting access token...')

    // Get access token using service account
    const accessToken = await getAccessToken(credentials)
    
    console.log('Access token obtained, fetching presentation...')

    // Fetch presentation data from Google Slides API
    const presentationResponse = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Google API response status:', presentationResponse.status)

    if (!presentationResponse.ok) {
      const errorText = await presentationResponse.text()
      console.error('Google API error response:', errorText)
      throw new Error(`Google API error: ${presentationResponse.status} ${presentationResponse.statusText} - ${errorText}`)
    }

    const presentation = await presentationResponse.json()
    console.log('Presentation fetched, slide count:', presentation.slides?.length || 0)
    
    // Extract slide thumbnails/images
    const slides: SlideData[] = presentation.slides.map((slide: any, index: number) => ({
      slideId: slide.objectId,
      imageUrl: `https://docs.google.com/presentation/d/${presentationId}/export/png?id=${presentationId}&pageid=${slide.objectId}`,
      pageNumber: index + 1,
    }))

    console.log('Returning slides:', slides.length)

    return new Response(
      JSON.stringify({ slides, totalSlides: slides.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Full error details:', {
      name: error?.constructor?.name,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Generate JWT and get access token from Google
async function getAccessToken(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/presentations.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // Create JWT
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedClaim = base64UrlEncode(JSON.stringify(claim))
  const signatureInput = `${encodedHeader}.${encodedClaim}`

  // Sign with private key
  const signature = await signRS256(signatureInput, credentials.private_key)
  const jwt = `${signatureInput}.${signature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', tokenData)
    throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`)
  }
  
  return tokenData.access_token
}

async function signRS256(data: string, privateKey: string): Promise<string> {
  try {
    console.log('Starting JWT signing process...')
    
    // Clean up the private key - handle escaped newlines
    let cleanPrivateKey = privateKey.trim()
    
    // Replace literal \n strings with actual newlines
    cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n')
    
    // Handle different private key formats
    if (!cleanPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      if (!cleanPrivateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
        // Assume it's raw base64 and add PEM headers
        cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----`
      }
    }
    
    console.log('Private key format after cleanup:', {
      startsWithBegin: cleanPrivateKey.startsWith('-----BEGIN'),
      endsWithEnd: cleanPrivateKey.includes('-----END'),
      length: cleanPrivateKey.length,
      hasActualNewlines: cleanPrivateKey.includes('\n')
    })
    
    // Extract the base64 content between the PEM markers
    const pemMatch = cleanPrivateKey.match(/-----BEGIN [^-]+-----\s*([^-]+)\s*-----END [^-]+-----/)
    
    if (!pemMatch) {
      throw new Error('Invalid PEM format - could not extract base64 content')
    }
    
    const base64Content = pemMatch[1].replace(/\s/g, '')
    console.log('Extracted base64 length:', base64Content.length)

    // Decode base64 to binary
    let binaryKey: Uint8Array
    try {
      binaryKey = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0))
      console.log('Successfully decoded base64, binary length:', binaryKey.length)
    } catch (e) {
      console.error('Base64 decode error:', e)
      throw new Error(`Failed to decode base64 private key: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    // Import key
    console.log('Importing cryptographic key...')
    // @ts-ignore - Web Crypto API available in Deno
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      // @ts-ignore - Uint8Array works in Deno
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    console.log('Key imported successfully, signing data...')

    // Sign
    const encoder = new TextEncoder()
    // @ts-ignore - Web Crypto API available in Deno
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(data)
    )

    console.log('Data signed successfully')
    return base64UrlEncode(new Uint8Array(signatureBuffer))
  } catch (error) {
    console.error('Signing error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    })
    throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string
  
  if (typeof data === 'string') {
    base64 = btoa(data)
  } else {
    base64 = btoa(String.fromCharCode(...data))
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}