const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Load Razorpay Checkout on demand (only when the person clicks Pay). */
export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const existing = document.querySelector(`script[src="${SRC}"]`);
    const script = existing || Object.assign(document.createElement('script'), { src: SRC, async: true });
    script.addEventListener('load', () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Payment window unavailable'))));
    script.addEventListener('error', () => reject(new Error("Couldn't load the payment window. Check your connection and try again.")));
    if (!existing) document.body.appendChild(script);
    return undefined;
  });
}
