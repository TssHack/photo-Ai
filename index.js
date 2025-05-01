const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// تولید userId تصادفی 8 رقمی
const generateUserId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// گرفتن پرامپت انگلیسی از GPT
const enhancePrompt = async (inputPrompt, userId) => {
  const url = "https://api.binjie.fun/api/generateStream";
  const headers = {
    "authority": "api.binjie.fun",
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "origin": "https://chat18.aichatos.xyz",
    "referer": "https://chat18.aichatos.xyz/",
    "user-agent": "Mozilla/5.0",
    "Content-Type": "application/json"
  };

  const data = {
    prompt: `فقط یک پرامپت تصویری حرفه‌ای و توصیفی به انگلیسی بده بر اساس متن زیر، بدون هیچ متن اضافه یا توضیحی:\n"${inputPrompt}"`,
    userId: userId,
    network: true,
    system: "",
    withoutContext: false,
    stream: false
  };

  const response = await axios.post(url, data, { headers });

  if (response.data && typeof response.data.prompt === 'string') {
    return response.data.prompt.trim();
  } else {
    throw new Error('GPT response did not contain a valid prompt string.');
  }
};

app.all('/', async (req, res) => {
  const method = req.method;
  const params = method === 'GET' ? req.query : req.body;

  const {
    prompt,
    seed = 40,
    model = 'unity',
    width = 1024,
    height = 1024,
    safe = true,
    enhance = true
  } = params;

  if (!prompt) {
    return res.status(400).json({
      code: 400,
      owner: 't.me/abj0o',
      message: 'Prompt is required.'
    });
  }

  const userId = generateUserId();

  try {
    const generatedPrompt = await enhancePrompt(prompt, userId);

    const query = new URLSearchParams({
      seed,
      model,
      width,
      height,
      nologo: true,
      safe,
      enhance
    }).toString();

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(generatedPrompt)}?${query}`;
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    if (buffer.length < 55) {
      return res.status(504).json({
        code: 504,
        owner: 't.me/abj0o',
        userId,
        prompt: generatedPrompt,
        settings: params,
        image: 'Error: No valid image received.'
      });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
      userId
    });
  }
});

app.listen(PORT, () => {
  console.log(`ImageAI API is running on port ${PORT}`);
});
