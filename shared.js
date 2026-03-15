const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwaJFCo7iQTEPYRb47FaarO_DLK7z-rylYxvQYq_qfgMrXCi2xBKDWbFMi7qovIWyvD/exec';

const confettiColors = ['#6dbf9e','#f0c040','#d46895','#6899cc','#a8d8c0','#f5edd6','#b8895a'];

// ── Confetti ──────────────────────────────────────────────
function launchConfetti() {
    const c = document.getElementById('confetti');
    c.innerHTML = '';
    for (let i = 0; i < 80; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const size = (6 + Math.random() * 9) + 'px';
        p.style.width = size; p.style.height = size;
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        p.style.border = '1.5px solid rgba(92,61,32,0.25)';
        p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        p.style.animationDelay = (Math.random() * 0.8) + 's';
        c.appendChild(p);
    }
}

// ── Ripple ────────────────────────────────────────────────
function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px';
    btn.appendChild(r);
    setTimeout(function() { r.remove(); }, 600);
}

// ── Star rating ───────────────────────────────────────────
function initStarRatings() {
    document.querySelectorAll('.rating-stars').forEach(function(group) {
        var labels = Array.from(group.querySelectorAll('.star-label'));
        var inputs = Array.from(group.querySelectorAll('input[type="radio"]'));

        function setLit(upToIdx) {
            labels.forEach(function(l, i) {
                l.style.color = i <= upToIdx ? 'var(--coin-yellow)' : 'var(--cream-dark)';
                l.style.transform = 'scale(1)';
            });
        }

        function restoreFromChecked() {
            var checked = group.querySelector('input[type="radio"]:checked');
            setLit(checked ? parseInt(checked.value) - 1 : -1);
        }

        labels.forEach(function(label, idx) {
            label.addEventListener('mouseenter', function() {
                labels.forEach(function(l, i) {
                    l.style.color = i <= idx ? 'var(--coin-yellow)' : 'var(--cream-dark)';
                });
            });
            label.addEventListener('mouseleave', restoreFromChecked);
            label.addEventListener('click', function() {
                if (inputs[idx]) inputs[idx].checked = true;
                setLit(idx);
            });
            label.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (inputs[idx]) inputs[idx].checked = true;
                setLit(idx);
            });
        });

        restoreFromChecked();
    });
}

function updateStarDisplay(group) {
    var labels = Array.from(group.querySelectorAll('.star-label'));
    var checked = group.querySelector('input[type="radio"]:checked');
    var val = checked ? parseInt(checked.value) - 1 : -1;
    labels.forEach(function(l, i) {
        l.style.color = i <= val ? 'var(--coin-yellow)' : 'var(--cream-dark)';
    });
}

// ── Collecte les réponses ─────────────────────────────────
function collecterReponses() {
    var data = JSON.parse(localStorage.getItem('gp_responses') || '{}');

    document.querySelectorAll('input[type="radio"]:checked').forEach(function(input) {
        if (input.name) data[input.name] = input.value;
    });

    var groupes = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(function(input) {
        if (input.name) {
            if (!groupes[input.name]) groupes[input.name] = [];
            if (input.checked) groupes[input.name].push(input.value);
        }
    });
    Object.keys(groupes).forEach(function(key) {
        data[key] = groupes[key].join(', ');
    });

    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(function(input) {
        if (input.name) data[input.name] = input.value;
    });

    localStorage.setItem('gp_responses', JSON.stringify(data));
    return data;
}

// ── Restaure les réponses ─────────────────────────────────
function restaurerReponses() {
    var data = JSON.parse(localStorage.getItem('gp_responses') || '{}');

    Object.keys(data).forEach(function(name) {
        try {
            var radio = document.querySelector('input[type="radio"][name="'+name+'"][value="'+CSS.escape(data[name])+'"]');
            if (radio) { radio.checked = true; }
        } catch(e) {}

        if (typeof data[name] === 'string') {
            data[name].split(', ').forEach(function(val) {
                try {
                    var cb = document.querySelector('input[type="checkbox"][name="'+name+'"][value="'+CSS.escape(val)+'"]');
                    if (cb) cb.checked = true;
                } catch(e) {}
            });
        }

        var txt = document.querySelector('input[type="text"][name="'+name+'"],input[type="email"][name="'+name+'"],textarea[name="'+name+'"]');
        if (txt) txt.value = data[name];
    });

    document.querySelectorAll('.rating-stars').forEach(function(group) {
        updateStarDisplay(group);
    });
}

// ── Envoi Google Sheets ───────────────────────────────────
function getOrCreateRowId() {
    var rowId = localStorage.getItem('gp_row_id');
    if (!rowId) {
        rowId = 'gp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('gp_row_id', rowId);
    }
    return rowId;
}

function envoyerReponses(btn, xp, nextOverlay) {
    var data = collecterReponses();
    data['row_id']    = getOrCreateRowId();
    data['timestamp'] = new Date().toISOString();

    fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
    }).catch(function(err) { console.warn('Envoi:', err); });

    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Réponses envoyées !';
    terminerValidation(btn, xp, nextOverlay);
}

function terminerValidation(btn, xp, showOverlay) {
    var coins = parseInt(localStorage.getItem('gp_coins') || '0') + xp;
    localStorage.setItem('gp_coins', coins);
    launchConfetti();
    setTimeout(function() {
        if (showOverlay) document.getElementById('thankyou-overlay').classList.add('show');
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalLabel || '<i class="fa-solid fa-check"></i> Valider';
    }, 700);
}

// ── Overlays ──────────────────────────────────────────────
function showConfirmOverlay(e) {
    addRipple(document.getElementById('validateBtn'), e);
    document.getElementById('confirm-overlay').classList.add('show');
}

var currentBtn = null;
function confirmValidate() {
    currentBtn = document.getElementById('validateBtn');
    currentBtn.dataset.originalLabel = currentBtn.innerHTML;
    currentBtn.disabled = true;
    currentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';
    closeConfirmOverlay();
    envoyerReponses(currentBtn, 50, true);
}

function closeConfirmOverlay() {
    var o = document.getElementById('confirm-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() { o.classList.remove('show'); o.style.opacity = ''; o.style.transition = ''; }, 380);
}

function closeOverlay() {
    var o = document.getElementById('thankyou-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() { o.classList.remove('show'); o.style.opacity = ''; o.style.transition = ''; }, 380);
}

function quitApp() {
    localStorage.removeItem('gp_responses');
    localStorage.removeItem('gp_coins');
    localStorage.removeItem('gp_row_id');
    window.close();
    setTimeout(function() { window.location.href = 'about:blank'; }, 300);
}

// ── Navigation ────────────────────────────────────────────
function saveAndNext(e, nextPage) {
    e.preventDefault();
    collecterReponses();
    // Si retour vers page1, ajouter ?back=1 pour ne pas effacer les réponses
    var destination = nextPage;
    if (nextPage.includes('page1')) destination = 'page1.html?back=1';
    var card = document.querySelector('.card');
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-30px)';
    setTimeout(function() { window.location.href = destination; }, 280);
}

// ── Champs conditionnels ──────────────────────────────────
function toggleConditional(id, show) {
    var field = document.getElementById(id);
    if (!field) return;
    var input = field.querySelector('input, textarea');
    if (show) { field.classList.add('visible'); }
    else { field.classList.remove('visible'); if (input) input.value = ''; }
}

function toggleField(fieldId, checkbox) {
    toggleConditional(fieldId, checkbox.checked);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    restaurerReponses();
    initStarRatings();
});
