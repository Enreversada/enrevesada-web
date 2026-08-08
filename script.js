document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Cargar Perfil y Cabecera
  fetch('content/perfil.json')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        if (data.pre_titulo) document.getElementById('pre-title').textContent = data.pre_titulo;
        if (data.titulo) document.getElementById('accent-title').textContent = data.titulo;
        if (data.subtitulo) document.getElementById('sub-title').textContent = data.subtitulo;
        
        // Ajuste de ruta con barra inicial para la foto de perfil
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
        data.items.forEach(post => {
          const article = document.createElement('article');
          article.classList.add('post-card');

          // Separa saltos de línea y detecta si es texto o imagen
          const lineas = post.contenido.split('\n').filter(p => p.trim() !== '');
          
          const htmlContenido = lineas.map(linea => {
            const textoLimpio = linea.trim();
            
            // Detecta si es una ruta de imagen (ej. "images/foto.jpeg" o "/images/foto.jpeg")
            if (textoLimpio.startsWith('images/') || textoLimpio.startsWith('/images/')) {
              const src = textoLimpio.startsWith('/') ? textoLimpio : '/' + textoLimpio;
              return `<img src="${src}" alt="Imagen del escrito" class="post-image">`;
            }
            
            // Si es texto normal
            return `<p>${textoLimpio}</p>`;
          }).join('');

          article.innerHTML = `
            <span class="date">${post.fecha}</span>
            <h3>${post.titulo}</h3>
            <p class="excerpt">${post.resumen}</p>
            
            <div class="post-full">
              ${htmlContenido}
            </div>

            <button class="toggle-btn">Leer escrito completo</button>
          `;

          // Evento desplegable
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