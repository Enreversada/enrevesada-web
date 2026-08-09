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

          // Generar enlace seguro para WhatsApp
          const urlWeb = encodeURIComponent(window.location.href);
          const textoShare = encodeURIComponent(`Lee este escrito de Enrevesada: "${post.titulo}"`);
          const whatsappUrl = `https://api.whatsapp.com/send?text=${textoShare}%20${urlWeb}`;

          article.innerHTML = `
            <span class="date">${post.fecha}</span>
            <h3>${post.titulo}</h3>
            <p class="excerpt">${post.resumen}</p>
            
            <div class="post-full">
              ${htmlContenido}
            </div>

            <!-- BARRA DE INTERACCIÓN -->
            <div class="post-actions">
              <button class="like-btn" id="like-${index}">
                <span class="heart-icon">&#10084;</span> 
                <span class="like-count">0</span>
              </button>
              
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="share-btn">
                Compartir en WhatsApp
              </a>
            </div>

            <!-- SECCIÓN DE COMENTARIOS (CUSDIS) -->
            <div class="comments-section">
              <div id="cusdis_thread"
                data-host="https://cusdis.com"
                data-app-id="60f733d0-c006-4fef-845a-e66e26f4ff77"
                data-page-id="${post.titulo.replace(/\s+/g, '-').toLowerCase()}"
                data-page-url="${window.location.href}"
                data-page-title="${post.titulo}"
              ></div>
            </div>

            <button class="toggle-btn">Leer escrito completo</button>
          `;

          // Contador de Me Gusta local
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

          // Plegable de lectura
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

        // Cargar script de comentarios Cusdis
        const scriptCusdis = document.createElement('script');
        scriptCusdis.src = 'https://cusdis.com/js/cusdis.es.js';
        scriptCusdis.async = true;
        scriptCusdis.defer = true;
        document.body.appendChild(scriptCusdis);
      }
    })
    .catch(err => console.log('Esperando publicaciones...'));
});