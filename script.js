document.addEventListener('DOMContentLoaded', () => {

  // 1. Cargar Perfil y Cabecera
  fetch('content/perfil.json')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        if (data.pre_titulo) document.getElementById('pre-title').textContent = data.pre_titulo;
        if (data.titulo) document.getElementById('accent-title').textContent = data.titulo;
        if (data.subtitulo) document.getElementById('sub-title').textContent = data.subtitulo;
        
        if (data.avatar) {
          const avatarUrl = data.avatar.startsWith('/') ? data.avatar : '/' + data.avatar;
          document.getElementById('profile-avatar').src = avatarUrl;
        }
      }
    })
    .catch(err => console.log('Usando perfil por defecto'));

  // Listener para ajustar automáticamente la altura del iframe cuando Cusdis responda
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.target === 'cusdis' && data.type === 'resize') {
        const activeIframe = document.querySelector('.cusdis-slot iframe');
        if (activeIframe && data.data) {
          activeIframe.style.height = `${data.data}px`;
        }
      }
    } catch (e) {
      // Ignorar mensajes que no provengan de Cusdis
    }
  });

  // 2. Cargar Escritos
  const container = document.getElementById('posts-container');

  fetch('content/escritos.json')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.items) {
        data.items.forEach((post, index) => {
          const article = document.createElement('article');
          article.classList.add('post-card');

          const lineas = post.contenido.split('\n').filter(p => p.trim() !== '');
          const htmlContenido = lineas.map(linea => {
            const textoLimpio = linea.trim();
            if (textoLimpio.startsWith('images/') || textoLimpio.startsWith('/images/')) {
              const src = textoLimpio.startsWith('/') ? textoLimpio : '/' + textoLimpio;
              return `<img src="${src}" alt="Imagen del escrito" class="post-image">`;
            }
            return `<p>${textoLimpio}</p>`;
          }).join('');

          const urlWeb = encodeURIComponent(window.location.href);
          const textoShare = encodeURIComponent(`Lee este escrito: "${post.titulo}"`);
          const whatsappUrl = `https://api.whatsapp.com/send?text=${textoShare}%20${urlWeb}`;

          // Identificador normalizado basado en el título
          const pageId = post.id || post.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

          article.innerHTML = `
            <span class="date">${post.fecha}</span>
            <h3>${post.titulo}</h3>
            <p class="excerpt">${post.resumen}</p>
            
            <div class="post-full" style="display: none;">
              ${htmlContenido}
              
              <div class="post-actions">
                <div class="left-actions">
                  <button class="icon-btn like-btn" id="like-${index}" title="Me gusta">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="like-count">0</span>
                  </button>

                  <button class="icon-btn comment-toggle-btn" title="Comentar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </button>
                </div>

                <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="share-btn">
                  Compartir
                </a>
              </div>

              <div class="comments-dropdown" style="display: none;">
                <p class="comments-title">Comentarios</p>
                <div class="cusdis-slot"></div>
              </div>
            </div>

            <button class="toggle-btn">Leer escrito completo</button>
          `;

          // Lógica de Likes
          const likeBtn = article.querySelector('.like-btn');
          const likeCount = article.querySelector('.like-count');
          let likes = parseInt(localStorage.getItem(`likes_post_${index}`) || '0');
          likeCount.textContent = likes;

          likeBtn.addEventListener('click', () => {
            if (!likeBtn.classList.contains('liked')) {
              likes++;
              likeCount.textContent = likes;
              localStorage.setItem(`likes_post_${index}`, likes);
              likeBtn.classList.add('liked');
            }
          });

          // Lógica Desplegable de Comentarios
          const commentBtn = article.querySelector('.comment-toggle-btn');
          const commentsDropdown = article.querySelector('.comments-dropdown');
          const cusdisSlot = article.querySelector('.cusdis-slot');

          commentBtn.addEventListener('click', () => {
            const isHidden = commentsDropdown.style.display === 'none';

            if (isHidden) {
              // 1. Mostrar el contenedor ANTES de inyectar el iframe
              commentsDropdown.style.display = 'block';

              // 2. Limpiar otros bloques de comentarios activos
              document.querySelectorAll('.cusdis-slot').forEach(slot => {
                if (slot !== cusdisSlot) slot.innerHTML = '';
              });

              // 3. Inyectar iframe con min-height explícito
              if (!cusdisSlot.querySelector('iframe')) {
                const appId = '60f733d0-c006-4fef-845a-e66e26f4ff77';
                const pageUrl = encodeURIComponent(window.location.href);
                const pageTitle = encodeURIComponent(post.titulo);
                
                const iframe = document.createElement('iframe');
                iframe.src = `https://cusdis.com/api/open/html?app_id=${appId}&page_id=${encodeURIComponent(pageId)}&page_url=${pageUrl}&page_title=${pageTitle}&lang=es`;
                iframe.style.width = '100%';
                iframe.style.minHeight = '350px';
                iframe.style.border = 'none';
                iframe.style.overflow = 'hidden';

                cusdisSlot.appendChild(iframe);
              }
            } else {
              commentsDropdown.style.display = 'none';
            }
          });

          // Plegable de lectura completa
          const btn = article.querySelector('.toggle-btn');
          const postFull = article.querySelector('.post-full');

          btn.addEventListener('click', () => {
            if (postFull.style.display === 'block') {
              postFull.style.display = 'none';
              btn.textContent = 'Leer escrito completo';
            } else {
              postFull.style.display = 'block';
              btn.textContent = 'Leer menos';
            }
          });

          container.appendChild(article);
        });
      }
    })
    .catch(err => console.log('Esperando publicaciones...'));
});