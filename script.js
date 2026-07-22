const header = document.querySelector(".site-header");
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
const year = document.getElementById("year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if (menuToggle && nav) {
  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const momentsTrack = document.getElementById("momentsTrack");

if (momentsTrack) {
  const slides = Array.from(momentsTrack.children);
  slides.forEach((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => {
      img.alt = "";
    });
    momentsTrack.appendChild(clone);
  });
}

const brandImpact = document.querySelector(".brand-impact");

if (brandImpact) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    brandImpact.classList.add("is-ready");
  } else {
    requestAnimationFrame(() => {
      brandImpact.classList.add("is-ready");
      window.setTimeout(() => {
        brandImpact.classList.add("is-hit");
      }, 2700);
    });
  }
}
