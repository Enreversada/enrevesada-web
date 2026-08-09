document.addEventListener('DOMContentLoaded', () => {

  // 1. Cargar Perfil desde la raíz (corrige el error 404 de la consola)
  fetch('perfil.json')
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

  // 2. Cargar Escritos desde content/escritos.json
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

        // Transforma "Agosto" a "agosto" para coincidir con tu panel de Cusdis
        const pageId = (post.id || post.titulo).toLowerCase().trim();

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

            <div class="comments-dropdown" style="display: none; margin-top: 15px;">
              <p class="comments-title">Comentarios</p>
              <div class="cusdis-slot" style="min-height: 400px; border: 2px solid red; width: 100%;"></div>
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

        // Desplegable de comentarios (Inyección bajo demanda)
        const commentBtn = article.querySelector('.comment-toggle-btn');
        const commentsDropdown = article.querySelector('.comments-dropdown');
        const cusdisSlot = article.querySelector('.cusdis-slot');

        commentBtn.addEventListener('click', () => {
          const isHidden = commentsDropdown.style.display === 'none';

          if (isHidden) {
            commentsDropdown.style.display = 'block';

            if (!cusdisSlot.querySelector('iframe')) {
              const appId = '60f733d0-c006-4fef-845a-e66e26f4ff77';
              const iframeSrc = `https://cusdis.com/api/open/html?app_id=${appId}&page_id=${encodeURIComponent(pageId)}&page_url=${encodeURIComponent(urlWeb)}&page_title=${encodeURIComponent(post.titulo)}&lang=es`;

              const iframe = document.createElement('iframe');
              iframe.src = iframeSrc;
              iframe.style.width = '100%';
              iframe.style.height = '480px';
              iframe.style.border = 'none';
              iframe.style.display = 'block';

              cusdisSlot.appendChild(iframe);
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