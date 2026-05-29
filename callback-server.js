require('dotenv').config()

const express = require('express')
const fs = require('fs')
const { google } = require('googleapis')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 3000

function criarOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json'))
  const { client_secret, client_id } = credentials.web || credentials.installed
  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback'
  return new google.auth.OAuth2(client_id, client_secret, redirectUri)
}

app.get('/auth/callback', async (req, res) => {
  const { code, state: userId } = req.query

  if (!code || !userId) {
    return res.send('❌ Erro ao conectar Gmail. Tente novamente.')
  }

  try {
    const oAuth2Client = criarOAuthClient()
    const { tokens } = await oAuth2Client.getToken(code)

    await axios.post(
      process.env.BOT_URL + '/salvar-token',
      { userId, token: tokens },
      { headers: { 'x-internal-token': process.env.INTERNAL_TOKEN } }
    )

    res.send('✅ Gmail conectado com sucesso! Pode fechar esta aba.')
  } catch (err) {
    console.error('ERRO CALLBACK GMAIL:', err.message)
    res.send('❌ Erro ao conectar Gmail. Tente novamente.')
  }
})

app.listen(PORT, () => {
  console.log(`🌐 Callback server online na porta ${PORT}`)
})
