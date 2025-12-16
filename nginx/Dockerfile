ARG NGINX_VERSION=stable-alpine
ARG FRONTEND_IMAGE=booking_frontend:latest
FROM ${FRONTEND_IMAGE} AS builder
FROM nginxinc/nginx-unprivileged:stable-alpine

# Use a built-in non-root user for security best practices
USER nginx

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --chown=nginx:nginx --from=builder /app/dist/*/browser /usr/share/nginx/html

# Expose port 8080 to allow HTTP traffic
# Note: The default NGINX container now listens on port 8080 instead of 80 
EXPOSE 8080

# Start Nginx directly with custom config
ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]