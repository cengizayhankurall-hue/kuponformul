async function test() {
  console.log('Testing live endpoint https://kuponformul.vercel.app/api/nesine/captcha ...');
  try {
    const res = await fetch('https://kuponformul.vercel.app/api/nesine/captcha');
    const json = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', {
      success: json.success,
      sessionId: json.sessionId,
      captchaLength: json.captchaImage ? json.captchaImage.length : 0,
      error: json.error
    });
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
