// Config: reemplaza estos valores con tus claves
const GAPI_CLIENT_ID = 'REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com';
const GAPI_API_KEY = 'REPLACE_WITH_YOUR_API_KEY';
const RSVP_FOLDER_NAME = 'Invitaciones-XV-Respuestas';

$(function(){
  // Inicializar portada
  $('#coverImage').css('background-image','linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.25)),url(images/cover.jpg)');

  // Countdown
  const eventDate = new Date('2026-07-10T19:00:00');
  function tick(){
    const now = new Date();
    let diff = Math.max(0,eventDate - now);
    const days = Math.floor(diff/86400000); diff%=86400000;
    const hours = Math.floor(diff/3600000); diff%=3600000;
    const minutes = Math.floor(diff/60000); diff%=60000;
    const seconds = Math.floor(diff/1000);
    $('#days').text(days);$('#hours').text(hours);$('#minutes').text(minutes);$('#seconds').text(seconds);
  }
  tick(); setInterval(tick,1000);

  // Animación sutil portada
  gsap.from('#nombre',{y:20,opacity:0,duration:1});

  // Scroll reveal: observa elementos con clase .reveal y anima con GSAP
  (function(){
    const revealEls = document.querySelectorAll('.reveal');
    if(!revealEls || !revealEls.length) return;
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const el = entry.target;
          gsap.fromTo(el, {y:20, opacity:0}, {y:0, opacity:1, duration:0.8, ease:'power2.out', stagger:0.06});
          el.classList.add('visible');
          obs.unobserve(el);
        }
      });
    }, {threshold: 0.12});
    revealEls.forEach(e=>io.observe(e));
  })();

  // Swiper gallery - stacked / coverflow look
  const swiper = new Swiper('.swiper-container',{
    loop:true,
    grabCursor:true,
    centeredSlides:true,
    slidesPerView:'auto',
    spaceBetween:24,
    effect:'coverflow',
    coverflowEffect:{
      rotate:12,
      stretch:0,
      depth:160,
      modifier:1.2,
      slideShadows:false
    },
    pagination:{el:'.swiper-pagination',clickable:true}
  });

  // Make clicking a slide bring it to center (mobile/tap friendly)
  document.querySelectorAll('.swiper-slide').forEach((s,i)=>{
    s.addEventListener('click',()=>{ if(!s.classList.contains('swiper-slide-active')) swiper.slideToLoop(i); });
  });

  // Load gapi client when needed
  function loadGapi(){
    return new Promise((resolve)=>{
      gapi.load('client:auth2',()=>{
        gapi.client.init({apiKey:GAPI_API_KEY,clientId:GAPI_CLIENT_ID,scope:'https://www.googleapis.com/auth/drive.file'}).then(()=>resolve());
      });
    });
  }

  // Create folder if not exists
  async function ensureFolder(name){
    const res = await gapi.client.drive.files.list({q:`name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,fields:'files(id,name)'});
    if(res.result.files && res.result.files.length) return res.result.files[0].id;
    const file = await gapi.client.drive.files.create({resource:{name, mimeType:'application/vnd.google-apps.folder'}});
    return file.result.id;
  }

  // Upload simple JSON file
  async function uploadResponse(folderId, filename, content){
    const boundary = '-------314159265358979323846';
    const metadata = {name:filename, parents:[folderId], mimeType:'application/json'};
    const multipart =
      '\r\n--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/json\r\n\r\n' +
      content + '\r\n--' + boundary + '--';

    const response = await gapi.client.request({path:'/upload/drive/v3/files',method:'POST',params:{uploadType:'multipart'},headers:{'Content-Type':'multipart/related; boundary="'+boundary+'"'},body:multipart});
    return response.result;
  }

  // Fallback: download JSON locally
  function downloadJSON(filename, content){
    const blob = new Blob([content],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  }

  // Create .ics file for calendar
  function createICS(summary, description, location, start){
    const dtStart = new Date(start).toISOString().replace(/[-:]|\.\d{3}/g,'');
    const dtEnd = new Date(new Date(start).getTime()+2*60*60*1000).toISOString().replace(/[-:]|\.\d{3}/g,'');
    return ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`SUMMARY:${summary}`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,`LOCATION:${location}`,`DESCRIPTION:${description}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  }

  // RSVP submit
  $('#rsvpForm').on('submit',async function(e){
    e.preventDefault();
    const name = $('#rsvpName').val();
    const phone = $('#rsvpPhone').val();
    const guests = $('#rsvpGuests').val() || 0;
    const email = $('#rsvpEmail').val();
    const answer = $('#rsvpAnswer').val();
    const payload = {name,email,answer,when:new Date().toISOString()};
    const filename = `rsvp_${name.replace(/\s+/g,'_')}_${Date.now()}.json`;

    // Try GAPI upload, otherwise download locally
    let uploaded=false;
    if(GAPI_CLIENT_ID && GAPI_API_KEY && !GAPI_CLIENT_ID.startsWith('REPLACE')){
      try{
        await loadGapi();
        if(!gapi.auth2.getAuthInstance().isSignedIn.get()) await gapi.auth2.getAuthInstance().signIn();
        const folderId = await ensureFolder(RSVP_FOLDER_NAME);
        await uploadResponse(folderId, filename, JSON.stringify(payload, null, 2));
        uploaded=true;
      }catch(err){console.warn('gapi-error',err);uploaded=false}
    }

    if(!uploaded){
      downloadJSON(filename, JSON.stringify(Object.assign(payload,{phone,guests}), null, 2));
      $('#rsvpResult').text('Respuesta guardada localmente (si quieres usar Google Drive, configura CLIENT_ID y API_KEY).');
    } else {
      $('#rsvpResult').text('Respuesta guardada en Google Drive. ¡Gracias!');
    }

    // Mostrar resultado con estilo
    const $res = $('#rsvpResult');
    $res.show();
    gsap.fromTo($res,{opacity:0,y:6},{opacity:1,y:0,duration:0.6});

    // Si confirmó asistir, ofrecer agregar al calendario
    if(answer==='yes'){
      const start = '2026-07-10T19:00:00';
      const ics = createICS('XV Años - María Fernanda','Celebración de XV años','Salón Los Ángeles',start);
      const blob = new Blob([ics],{type:'text/calendar'});
      const url = URL.createObjectURL(blob);
      const gcalLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('XV Años - María Fernanda')}&dates=${start.replace(/[:-]/g,'')}/${new Date(new Date(start).getTime()+2*60*60*1000).toISOString().replace(/[:-]|\.\d{3}/g,'')}&details=${encodeURIComponent('Te esperamos en Salón Los Ángeles')}&location=${encodeURIComponent('Salón Los Ángeles')}`;
      $('#rsvpResult').append(`<div style="margin-top:10px">Añadir a tu calendario: <a href="${gcalLink}" target="_blank">Google Calendar</a> · <a href="${url}" download="evento.ics">Descargar .ics</a></div>`);
    }
  });

  // Music player behavior
  (function(){
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');
    const progressWrap = document.getElementById('progressWrap');
    const currentEl = document.getElementById('current');
    const durationEl = document.getElementById('duration');
    if(!audio || !playBtn) return;

    function formatTime(sec){
      const s = Math.floor(sec%60).toString().padStart(2,'0');
      const m = Math.floor(sec/60);
      return `${m}:${s}`;
    }

    audio.addEventListener('loadedmetadata', ()=>{
      durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', ()=>{
      const pct = (audio.currentTime / (audio.duration || 1)) * 100;
      progress.style.width = pct + '%';
      currentEl.textContent = formatTime(audio.currentTime);
    });

    playBtn.addEventListener('click', ()=>{
      if(audio.paused){
        audio.play();
        playBtn.textContent = '⏸';
      } else {
        audio.pause();
        playBtn.textContent = '▶';
      }
    });

    progressWrap.addEventListener('click', (e)=>{
      const rect = progressWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      audio.currentTime = pct * (audio.duration || 0);
    });
  })();

});
