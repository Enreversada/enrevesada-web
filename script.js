const SUPABASE_URL = 'https://fkmkoryqvyobiwlixstx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A55H3d-UeWQCgIP6MYgrBw_25qhZneL';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('posts-container');

  // 1. Cargar Escritos desde Supabase
  const { data: posts, error } = await _supabase.from('escritos').select('*');

  if (error) {
    console.error('Error al cargar escritos:', error);
    container.innerHTML = '<p style="text-align:center;">No se pudieron cargar las publicaciones.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p style="text-align:center;">Aún no hay publicaciones creadas en Supabase.</p>';
    return;
  }

  for (const [index, post] of posts.entries()) {
    const article = document.createElement('article');
    article.classList.add('post-card');

    // Procesar el texto del escrito o imágenes
    const lineas = (post.contenido || '').split('\n').filter(p => p.trim() !== '');
    const htmlContenido = lineas.map(linea => {
      const t = linea.trim();
      const esImagenUrl = t.startsWith('http://') || t.startsWith('https://');
      const esImagenLocal = t.startsWith('images/') || t.startsWith('/images/');

      if (esImagenUrl || esImagenLocal) {
        const src = esImagenLocal && !t.startsWith('/') ? '/' + t : t;
        return `<img src="${src}" alt="Imagen del escrito" class="post-image" style="max-width:100%; height:auto; display:block; margin: 15px auto; border-radius: 8px;">`;
      }
      return `<p>${t}</p>`;
    }).join('');

    const urlWeb = window.location.href;
    const textoShare = encodeURIComponent(`Lee este escrito: "${post.titulo}"`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${textoShare}%20${encodeURIComponent(urlWeb)}`;

    // Contar comentarios aprobados para este escrito
    const { count: commentCount } = await _supabase
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('escrito_id', post.id)
      .eq('aprobado', true);

    article.innerHTML = `
      <span class="date">${post.fecha || ''}</span>
      <h3>${post.titulo || 'Sin título'}</h3>
      <p class="excerpt">${post.resumen || ''}</p>
      
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
              <span class="comment-count">${commentCount || 0}</span>
            </button>
          </div>

          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="share-btn">
            Compartir
          </a>
        </div>

        <div class="comments-dropdown" style="display: none; margin-top: 15px;">
          <p class="comments-title" style="font-weight: 600; margin-bottom: 10px;">Comentarios</p>
          <div class="comments-list" style="margin-bottom: 15px;"></div>
          
          <form class="comment-form" style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" placeholder="Tu nombre" class="comm-name" required style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <textarea placeholder="Escribe un comentario..." class="comm-text" required style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-height: 70px;"></textarea>
            <button type="submit" style="padding: 8px 15px; cursor: pointer; align-self: flex-start; background: #333; color: #fff; border: none; border-radius: 4px;">Enviar comentario</button>
            <p class="comm-msg" style="font-size: 0.85em; color: green; display: none; margin-top: 5px;">¡Enviado! Pendiente de aprobación.</p>
          </form>
        </div>
      </div>

      <button class="toggle-btn">Leer escrito completo</button>
    `;

    // Lógica de Likes
    const likeBtn = article.querySelector('.like-btn');
    const likeCount = article.querySelector('.like-count');
    let likes = parseInt(localStorage.getItem(`likes_post_${post.id || index}`) || '0');
    likeCount.textContent = likes;

    likeBtn.addEventListener('click', () => {
      if (!likeBtn.classList.contains('liked')) {
        likes++;
        likeCount.textContent = likes;
        localStorage.setItem(`likes_post_${post.id || index}`, likes);
        likeBtn.classList.add('liked');
      }
    });

    // Desplegable de comentarios
    const commentBtn = article.querySelector('.comment-toggle-btn');
    const commentsDropdown = article.querySelector('.comments-dropdown');
    const commentsList = article.querySelector('.comments-list');
    const commentForm = article.querySelector('.comment-form');
    const commentCountSpan = article.querySelector('.comment-count');

    commentBtn.addEventListener('click', async () => {
      const isHidden = commentsDropdown.style.display === 'none';
      commentsDropdown.style.display = isHidden ? 'block' : 'none';

      if (isHidden) {
        commentsList.innerHTML = '<p style="color: #888; font-size: 0.85em;">Cargando comentarios...</p>';
        
        const { data: comments } = await _supabase
          .from('comentarios')
          .select('*')
          .eq('escrito_id', post.id)
          .eq('aprobado', true);

        if (comments && comments.length > 0) {
          commentCountSpan.textContent = comments.length;
          commentsList.innerHTML = comments.map(c => `
            <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; margin-bottom: 8px; text-align: left;">
              <strong style="font-size: 0.9em; color: #333;">${c.nombre}</strong>
              <p style="margin: 4px 0 0 0; font-size: 0.9em;">${c.texto}</p>
            </div>
          `).join('');
        } else {
          commentCountSpan.textContent = 0;
          commentsList.innerHTML = '<p style="color: #777; font-size: 0.85em;">No hay comentarios aún.</p>';
        }
      }
    });

    // Enviar nuevo comentario a Supabase
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombreInput = article.querySelector('.comm-name');
      const textoInput = article.querySelector('.comm-text');

      const { error: insertError } = await _supabase.from('comentarios').insert([
        { 
          escrito_id: post.id, 
          nombre: nombreInput.value, 
          texto: textoInput.value, 
          aprobado: false 
        }
      ]);

      if (!insertError) {
        commentForm.reset();
        article.querySelector('.comm-msg').style.display = 'block';
      } else {
        alert('Hubo un error al enviar el comentario.');
      }
    });

    // Toggle para desplegar escrito completo
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
  }
});