history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ==========================================
// STICKY HEADER & SCROLL SPY
// ==========================================
window.addEventListener('scroll', function () {
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Toggle Sticky Header
    if (window.scrollY > 100) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }

    // Scroll Spy
    let currentSectionId = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            currentSectionId = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentSectionId) {
            link.classList.add('active');
        }
    });
});

// ==========================================
// MOBILE NAVIGATION MENU
// ==========================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('open');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('open');
    });
});

// ==========================================
// ABOUT SECTION — ALTERNATING VIDEO STACK
// Only one video plays at a time. When the active
// video ends, it fades back (opacity 60%, paused)
// and the other one becomes active and plays.
// ==========================================
(function initAboutVideoStack() {
    const stack = document.getElementById('about-video-stack');
    if (!stack) return;

    const items = Array.from(stack.querySelectorAll('.stack-item'));
    const videos = items.map(item => item.querySelector('video'));
    if (videos.length < 2 || videos.some(v => !v)) return;

    // Start with whichever item already has .active in the HTML (stack-item-2),
    // falling back to the first one.
    let activeIndex = items.findIndex(item => item.classList.contains('active'));
    if (activeIndex === -1) activeIndex = 0;

    function activate(index) {
        items.forEach((item, i) => {
            const video = videos[i];
            if (i === index) {
                item.classList.add('active');
                video.currentTime = 0;
                // play() returns a promise; catch avoids console errors if
                // the browser blocks playback before any user interaction.
                video.play().catch(() => {});
            } else {
                item.classList.remove('active');
                video.pause();
            }
        });
    }

    // When the active video finishes, switch to the next one in the cycle.
    videos.forEach((video, i) => {
        video.addEventListener('ended', () => {
            if (i !== activeIndex) return; // only the active video triggers a swap
            activeIndex = (activeIndex + 1) % items.length;
            activate(activeIndex);
        });
    });

    // Kick off the first playback once the section is (about to be) visible,
    // so we don't waste bandwidth/battery before the user scrolls there.
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                activate(activeIndex);
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });

    observer.observe(stack);
})();

// ==========================================
// CUSTOM DROPDOWN CONTROL (CATALOG FILTERS)
// ==========================================
function toggleDropdown(id, trigger) {
    // Close all dropdowns first except this one
    const dropdowns = document.querySelectorAll('.dropdown-panel');
    dropdowns.forEach(dp => {
        if (dp.getAttribute('id') !== id) {
            dp.classList.remove('show');
            dp.previousElementSibling.classList.remove('open');
        }
    });

    const panel = document.getElementById(id);
    panel.classList.toggle('show');
    trigger.classList.toggle('open');
}

// Close dropdown when clicking outside
window.addEventListener('click', function (e) {
    if (!e.target.closest('.filter-dropdown-container')) {
        document.querySelectorAll('.dropdown-panel').forEach(dp => {
            dp.classList.remove('show');
        });
        document.querySelectorAll('.filter-trigger').forEach(ft => {
            ft.classList.remove('open');
        });
    }
});

// ==========================================
// FILTER LOGIC
// ==========================================
function applyFilters() {
    const selectedModels = Array.from(document.querySelectorAll('#dropdown-model input:checked')).map(el => el.value);
    const selectedGenders = Array.from(document.querySelectorAll('#dropdown-gender input:checked')).map(el => el.value);
    const selectedColors = Array.from(document.querySelectorAll('#dropdown-color input:checked')).map(el => el.value);

    // Only filter items inside the catalog grid (best seller cards reuse the
    // same class but live outside #catalog-grid, so they're unaffected).
    // The Instagram CTA card has no data-model attribute, so it's excluded too.
    const items = document.querySelectorAll('#catalog-grid .catalog-item[data-model]');
    let visibleCount = 0;

    items.forEach(item => {
        const itemModel = item.getAttribute('data-model');
        const itemGender = item.getAttribute('data-gender');
        const itemColor = item.getAttribute('data-color');

        const modelMatch = selectedModels.length === 0 || selectedModels.includes(itemModel);
        const genderMatch = selectedGenders.length === 0 || selectedGenders.includes(itemGender);
        const colorMatch = selectedColors.length === 0 || selectedColors.includes(itemColor);

        if (modelMatch && genderMatch && colorMatch) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Update badge counts
    updateBadge('dropdown-model', selectedModels.length);
    updateBadge('dropdown-gender', selectedGenders.length);
    updateBadge('dropdown-color', selectedColors.length);

    // Show reset button if any filter is selected
    const hasFilters = selectedModels.length > 0 || selectedGenders.length > 0 || selectedColors.length > 0;
    document.getElementById('btn-reset').style.display = hasFilters ? 'inline-flex' : 'none';

    // Handle empty state
    const grid = document.getElementById('catalog-grid');
    let emptyState = document.getElementById('empty-state-msg');

    if (visibleCount === 0) {
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.id = 'empty-state-msg';
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <h3 class="empty-state-title">Nema poklapanja</h3>
                <p class="empty-state-desc">Pokušajte sa nekom drugom kombinacijom filtera ili resetujte pretragu.</p>
            `;
            grid.appendChild(emptyState);
        }
    } else {
        if (emptyState) {
            emptyState.remove();
        }
    }
}

function updateBadge(dropdownId, count) {
    const trigger = document.getElementById(dropdownId).previousElementSibling;
    let badge = trigger.querySelector('.badge');

    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'badge';
            trigger.appendChild(badge);
        }
        badge.textContent = count;
        trigger.classList.add('active-trigger');
    } else {
        if (badge) {
            badge.remove();
        }
        trigger.classList.remove('active-trigger');
    }
}

function resetFilters() {
    document.querySelectorAll('.dropdown-panel input').forEach(input => {
        input.checked = false;
    });
    applyFilters();
}

// ==========================================
// FAQ TOGGLE
// ==========================================
function toggleFaq(btn) {
    const item = btn.parentElement;
    const answer = item.querySelector('.faq-answer');

    // Close other FAQ items
    document.querySelectorAll('.faq-item').forEach(el => {
        if (el !== item) {
            el.classList.remove('active');
            el.querySelector('.faq-answer').style.maxHeight = null;
        }
    });

    item.classList.toggle('active');
    if (item.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
        answer.style.maxHeight = null;
    }
}