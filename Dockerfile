FROM nginx:stable-alpine
COPY dist /usr/share/nginx/html
# optional: copy custom nginx conf if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
