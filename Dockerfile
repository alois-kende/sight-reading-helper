FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public

# Uploaded pieces live in /app/data: mount a volume there so they survive updates.
RUN mkdir -p /app/data && chown node:node /app/data
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/pieces').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "server.js"]
