"use client";

import React, { useEffect, useMemo, useState } from "react";
import Section from "@/components/Section";
import { MessageCircle, Navigation, MapPin, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Branch = {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  mapsUrl?: string;
  openingHours?: string;
  image: string;
};

const branches: Branch[] = [
  {
    id: "miranda",
    name: "Sede Miranda",
    phone: "+57 315 5287225",
    whatsapp: "573155287225",
    address: "Calle 8 # 7 - 23",
    city: "Miranda, Cauca",
    mapsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Calle+8+%23+7+-+23,+Miranda,+Cauca",
    openingHours: "Lun-Dom 8:00–19:00",
    image: "/sede-miranda.jpg",
  },
  {
    id: "florida",
    name: "Sede Florida",
    phone: "+57 310 3585608",
    whatsapp: "573103585608",
    address: "Calle 6 con Carrera 15, Esquina",
    city: "Florida, Valle del Cauca",
    mapsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Calle+6+con+Carrera+15,+Florida,+Valle+del+Cauca",
    openingHours: "Lun-Sáb 9:00–18:00",
    image: "/sede-florida.png",
  },
];

// ===== Utils =====
function onlyDigits(v?: string) {
  return (v ?? "").replace(/\D+/g, "");
}
function telSanitize(v?: string) {
  const s = (v ?? "").replace(/\s+/g, "");
  return s.startsWith("+") ? s : `+${onlyDigits(s)}`;
}
function waLink(num?: string, text?: string) {
  const digits = onlyDigits(num);
  if (!digits) return undefined;
  const t = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${t}`;
}

// ===== Reveal fallback =====
function useRevealFallback() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("reveal-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("reveal-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.16, rootMargin: "40px 0px -20px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ===== Variants =====
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ===== Banner =====
function Banner({ b }: { b: Branch }) {
  const wa = waLink(b.whatsapp, "¡Hola! Quiero más info 😊");

  return (
    <motion.article
      className="branch-banner"
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      tabIndex={0}
    >
      <img src={b.image} alt="" className="banner-img" loading="lazy" />
      <div className="banner-overlay" />
      <motion.div className="banner-content" variants={item}>
        <h3 className="banner-title">{b.name}</h3>
        <p className="banner-sub">
          <MapPin size={18} style={{ marginRight: 6, verticalAlign: "-3px" }} />
          {b.address} · {b.city}
        </p>
        <p className="banner-hours">{b.openingHours}</p>
        <div className="banner-cta">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn">
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
          {b.mapsUrl && (
            <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn secondary">
              <Navigation size={18} /> Ver en Maps
            </a>
          )}
        </div>
        {b.phone && (
          <a className="banner-phone" href={`tel:${telSanitize(b.phone)}`}>
            <Phone size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
            {b.phone}
          </a>
        )}
      </motion.div>
    </motion.article>
  );
}

export default function LocationsPastel() {
  useRevealFallback();

  return (
    <Section id="sedes" variant="alt">
      <header data-reveal style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 className="h2">Nuestras sedes</h2>
        <p className="lead">Elige tu sede y contáctanos de una 📲</p>
      </header>
      <div className="branch-grid-2">
        <AnimatePresence>
          {branches.map((b) => (
            <Banner key={b.id} b={b} />
          ))}
        </AnimatePresence>
      </div>
    </Section>
  );
}
