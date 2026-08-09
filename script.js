document.addEventListener('DOMContentLoaded', () => {

  // 1. Cargar el script oficial de Cusdis globalmente una sola vez
  if (!document.getElementById('cusdis-script')) {
    window.CUSDIS_LOCALE = {
      powered_by: 'Comentarios',
      post_comment: 'Publicar comentario',
      loading: 'Cargando...',
      email: 'Correo electrónico (opcional)',
      nickname: 'Nombre o Apodo',
      reply_placeholder: 'Escribe tu comentario aquí...',
      reply_btn: 'Responder',
      sending: 'Enviando...',
      mod_badge: 'Mod',
      content_is_required: 'El comentario no puede estar vacío',
      nickname_is_required: 'El nombre es obligatorio',
      comment_has_been_submitted: 'Comentario enviado y pendiente de aprobación'
    };

    const script = document.createElement('script');
    script.id = 'cusdis-script';
    script.src = 'https://cusdis.com/js/cusdis.es.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // 2. Cargar Perfil y Cabecera
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
    .catch(() => console.log('Usando perfil por defecto'));

  // 3. Cargar Escritos
  const container = document.getElementById('posts-container');

  fetch('content/escritos.json')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data || !data.items) return;

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

        const urlWeb = window.location.href;
        const textoShare = encodeURIComponent(`Lee este escrito: "${post.titulo}"`);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${textoShare}%20${encodeURIComponent(urlWeb)}`;

        // Identificador persistente
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

        // Renderizado dinámico de comentarios al desplegar
        const commentBtn = article.querySelector('.comment-toggle-btn');
        const commentsDropdown = article.querySelector('.comments-dropdown');
        const cusdisSlot = article.querySelector('.cusdis-slot');

        commentBtn.addEventListener('click', () => {
          const isHidden = commentsDropdown.style.display === 'none';

          if (isHidden) {
            commentsDropdown.style.display = 'block';

            if (!cusdisSlot.hasChildNodes()) {
              // Limpiar otros contenedores abiertos
              document.querySelectorAll('.cusdis-slot').forEach(s => s.innerHTML = '');

              const thread = document.createElement('div');
              thread.id = 'cusdis_thread';
              thread.dataset.host = 'https://cusdis.com';
              thread.dataset.appId = '60f733d0-c006-4fef-845a-e66e26f4ff77';
              thread.dataset.pageId = pageId;
              thread.dataset.pageUrl = urlWeb;
              thread.dataset.pageTitle = post.titulo;

              cusdisSlot.appendChild(thread);

              const ejecutarRender = () => {
                if (window.CUSDIS && typeof window.CUSDIS.render === 'function') {
                  window.CUSDIS.render(thread);
                }
              };

              if (window.CUSDIS) {
                ejecutarRender();
              } else {
                document.getElementById('cusdis-script').addEventListener('load', ejecutarRender);
              }
            }
          } else {
            commentsDropdown.style.display = 'none';
          }
        });

        // Toggle escrito completo
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
    })
    .catch(() => console.log('Esperando publicaciones...'));
});