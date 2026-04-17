services:
  - type: web
    name: sofi-v7-kuhul
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MI_ID
        value: sofi-node-v7
      - key: SOFI_API_KEY
        sync: false
      - key: MONGO_URI
        sync: false
      - key: BINANCE_API_KEY
        sync: false
      - key: BINANCE_SECRET
        sync: false
      - key: MP_ACCESS_TOKEN
        sync: false
      - key: ETH_ADDRESS
        value: "0x14bA243A9BA7824A4F675788E4e2F19fC010BEaE"
