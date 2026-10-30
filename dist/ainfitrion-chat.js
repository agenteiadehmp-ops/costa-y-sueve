(() => {
  const chat = document.querySelector('#ainfitrion[data-property]');
  if (!chat) return;
  const messages = chat.querySelector('[data-ainfitrion-messages]');
  const form = chat.querySelector('[data-ainfitrion-form]');
  const input = form.elements.question;
  const send = form.querySelector('button[type="submit"]');
  const status = chat.querySelector('[data-ainfitrion-status]');
  const history = [];
  const endpoint = 'https://costa-y-sueve.vercel.app/api/ainfitrion';
  let pending = false;

  function bubble(text, role) {
    const p = document.createElement('p');
    p.className = `ainfitrion-message is-${role}`;
    p.textContent = text;
    messages.append(p);
    messages.scrollTop = messages.scrollHeight;
    return p;
  }

  async function ask(question) {
    question = question.trim();
    if (!question || pending) return;
    pending = true;
    input.value = '';
    input.disabled = send.disabled = true;
    chat.querySelector('.ainfitrion-suggestions').hidden = true;
    bubble(question, 'user');
    const waiting = bubble('Estoy pensando…', 'assistant');
    status.textContent = 'Ainfitrión está preparando su respuesta.';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({property: chat.dataset.property, question, history: history.slice(-8)}),
        signal: AbortSignal.timeout(22000)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.code || 'No disponible');
      }
      const data = await response.json();
      if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Respuesta vacía');
      waiting.textContent = data.answer.trim();
      history.push({role: 'user', content: question}, {role: 'assistant', content: data.answer.trim()});
      status.textContent = 'Respuesta recibida.';
    } catch (error) {
      waiting.textContent = error.message === 'AUTH_MISSING'
        ? 'Ainfitrión aún no está activado. Mientras tanto, puedes consultar a Hernán por WhatsApp desde el enlace de abajo.'
        : 'Ahora mismo no puedo responder. Puedes consultar a Hernán por WhatsApp desde el enlace de abajo.';
      status.textContent = 'El asistente no está disponible en este momento.';
    } finally {
      pending = false;
      input.disabled = send.disabled = false;
      messages.scrollTop = messages.scrollHeight;
      input.focus();
    }
  }

  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  chat.querySelectorAll('[data-ainfitrion-suggestion]').forEach(button => {
    button.addEventListener('click', () => ask(button.textContent));
  });
})();
