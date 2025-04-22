
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.all('/', async (req, res) => {
  const method = req.method;
  const params = method === 'GET' ? req.query : req.body;

  const { prompt, seed = 40, model = 'unity', width = 1024, height = 1024, safe = true, enhance = true } = params;

  if (!prompt) {
    return res.status(400).json({ code: 400, owner: 't.me/haji_nuII', message: 'Prompt is required.' });
  }

  try {
    const translate = async (text, from = 'fa', to = 'en') => {
      const data = new URLSearchParams({ sl: from, tl: to, q: text });
      const headers = {
        'User-Agent': 'AndroidTranslate/5.3.0.RC02.130475354-53000263 5.1 phone TRANSLATE_OPM5_TEST_1',
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      const response = await axios.post(
        'https://translate.google.com/translate_a/single?client=at&dt=t&dt=ld&dt=qca&dt=rm&dt=bd&dj=1&hl=es-ES&ie=UTF-8&oe=UTF-8&inputm=2&otf=2&iid=1dd3b944-fa62-4b55-b330-74909a99969e',
        data.toString(),
        { headers }
      );
      return response.data.sentences[0].trans;
    };

    const translatedPrompt = await translate(prompt);
    const query = new URLSearchParams({ seed, model, width, height, nologo: true, safe, enhance }).toString();
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(translatedPrompt)}?${query}`;

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    if (buffer.length < 55) {
      return res.status(504).json({ code: 504, owner: 't.me/haji_nuII', prompt: translatedPrompt, settings: params, image: 'Error: No valid image received.' });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`ImageAI API is running on port ${PORT}`);
});
