'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, Business, ProductCategory, CartItem } from "@/types";
import { formatCurrency } from "@/utils/whatsapp";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSpreads(categories: ProductCategory[], products: Product[]) {
  const pages: any[] = [];
  // Cover
  pages.push({ type: "cover" });
  
  // Group products by category
  for (const cat of categories) {
    const catProducts = products.filter(p => p.categoryId === cat.id);
    if (catProducts.length === 0) continue;

    pages.push({ type: "divider", category: cat });
    
    const chunks: Product[][] = [];
    for (let i = 0; i < catProducts.length; i += 4) {
      chunks.push(catProducts.slice(i, i + 4));
    }
    
    for (const chunk of chunks) {
      pages.push({ type: "products", products: chunk, category: cat });
    }
  }
  
  pages.push({ type: "back" });

  // Pair into spreads: [left, right]
  const spreads: any[][] = [];
  for (let i = 0; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1] || { type: "empty" }]);
  }
  return spreads;
}

// Mock ingredients for 4D view since they don't exist in DB yet
function getMockIngredients(product: Product) {
  return [
    { name: "Ingrediente Principal", emoji: "✨", benefits: ["Calidad Premium", "Sabor Único"], x: 45, y: 45 },
    { name: "Secreto de la Casa", emoji: "🌿", benefits: ["Natural", "Saludable"], x: 25, y: 30 },
    { name: "Toque Especial", emoji: "🔥", benefits: ["Receta Original", "Fresco"], x: 70, y: 60 },
  ];
}

// ─── Ingredient 4D Modal ──────────────────────────────────────────────────────

interface Modal4DProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  accent: string;
  currency: string;
}

function Modal4D({ product, onClose, onAddToCart, accent, currency }: Modal4DProps) {
  const [visible, setVisible] = useState(false);
  const [activeIng, setActiveIng] = useState<number | null>(null);
  const ingredients = getMockIngredients(product);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function getCardStyle(x: number, y: number) {
    const left = x < 50;
    const top = y < 50;
    return {
      left: left ? "2%" : "auto",
      right: left ? "auto" : "2%",
      top: top ? `${Math.max(5, y - 8)}%` : "auto",
      bottom: top ? "auto" : `${Math.max(5, 100 - y - 20)}%`,
    };
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      {/* BG */}
      <div style={{
        position: "absolute", inset: 0,
        background: "#1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Product Image */}
        <div style={{
          width: '80%', height: '60%', position: 'relative',
          filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.8))",
          transform: visible ? "scale(1)" : "scale(0.85)",
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill style={{ objectFit: 'contain' }} />
          ) : (
             <div style={{ fontSize: 160 }}>🍽️</div>
          )}
        </div>
        
        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }} />
      </div>

      {/* SVG lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {ingredients.map((ing, i) => {
          const cardLeft = ing.x < 50;
          const cardTop = ing.y < 50;
          const x2pct = cardLeft ? 18 : 82;
          return (
            <line
              key={i}
              x1={`${ing.x}%`} y1={`${ing.y}%`}
              x2={`${x2pct}%`} y2={`${cardTop ? ing.y + 5 : 100 - ing.y - 5}%`}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
              strokeDasharray="4 3"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity 0.4s ease ${i * 0.1 + 0.3}s`,
              }}
            />
          );
        })}
      </svg>

      {/* Ingredient markers */}
      {ingredients.map((ing, i) => (
        <div
          key={i}
          onClick={() => setActiveIng(activeIng === i ? null : i)}
          style={{
            position: "absolute",
            left: `${ing.x}%`, top: `${ing.y}%`,
            transform: "translate(-50%, -50%)",
            width: 40, height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "2px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, cursor: "pointer",
            boxShadow: "0 0 20px rgba(255,255,255,0.2)",
            opacity: visible ? 1 : 0,
            transition: `opacity 0.4s ease ${i * 0.1 + 0.2}s, transform 0.2s ease`,
            zIndex: 10,
            animation: "floatDot 3s ease-in-out infinite",
            animationDelay: `${i * 0.7}s`,
          }}
        >
          {ing.emoji}
        </div>
      ))}

      {/* Ingredient cards */}
      {ingredients.map((ing, i) => {
        const cs = getCardStyle(ing.x, ing.y);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...cs as any,
              width: 160,
              background: "rgba(20,20,20,0.65)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 12,
              padding: "10px 12px",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transition: `opacity 0.5s ease ${i * 0.12 + 0.3}s, transform 0.5s ease ${i * 0.12 + 0.3}s`,
              zIndex: 20,
              animation: "floatCard 4s ease-in-out infinite",
              animationDelay: `${i * 0.8 + 0.5}s`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{ing.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{ing.name}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {ing.benefits.map((b, bi) => (
                <div key={bi} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "20px 20px 40px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Vista 4D</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{product.name}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: accent, marginTop: 2 }}>{formatCurrency(product.price, currency)}</div>
        </div>
        <button onClick={close} style={{
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><X size={20} /></button>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "40px 20px 32px",
        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.5 }}>{product.description}</p>
        <button
          onClick={() => { onAddToCart(product); close(); }}
          style={{
            background: accent, color: "#fff", border: "none", borderRadius: 14, padding: "16px",
            fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 30px ${accent}60`,
          }}
        >
          + Agregar al pedido
        </button>
      </div>

      <style>{`
        @keyframes floatDot {
          0%,100% { transform: translate(-50%,-50%) scale(1); }
          50%      { transform: translate(-50%,-56%) scale(1.08); }
        }
        @keyframes floatCard {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// ─── Page Contents ────────────────────────────────────────────────────────────

function CoverPage({ business, accent }: { business: Business, accent: string }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: `linear-gradient(160deg, #1A1208 0%, #2A1E08 50%, #1A1208 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 12, border: `1px solid ${accent}40`, borderRadius: 8, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 16, border: `1px solid ${accent}20`, borderRadius: 6, pointerEvents: "none" }} />
      {/* Corner ornaments */}
      {[0,1,2,3].map((i) => (
        <div key={i} style={{
          position: "absolute",
          top: i < 2 ? 12 : 'auto', bottom: i >= 2 ? 12 : 'auto',
          left: i % 2 === 0 ? 12 : 'auto', right: i % 2 !== 0 ? 12 : 'auto',
          width: 20, height: 20,
          borderTop: (i === 0 || i === 3) ? `2px solid ${accent}` : "none",
          borderBottom: (i === 1 || i === 2) ? `2px solid ${accent}` : "none",
          borderLeft: (i === 0 || i === 2) ? `2px solid ${accent}` : "none",
          borderRight: (i === 1 || i === 3) ? `2px solid ${accent}` : "none",
        }} />
      ))}

      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 20, border: `3px solid ${accent}` }}>
        {business.logoUrl ? <Image src={business.logoUrl} alt="logo" width={80} height={80} style={{ borderRadius: '50%', objectFit: 'cover' }} /> : '🏪'}
      </div>

      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: "0.3em", color: accent, textTransform: "uppercase", marginBottom: 12 }}>Carta Digital</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 400, color: "#F5E6C8", textAlign: "center", lineHeight: 1.2, marginBottom: 12 }}>{business.name}</h1>
      <div style={{ width: 40, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)`, marginBottom: 12 }} />
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(245,230,200,0.5)", textAlign: "center" }}>{business.description}</p>
      <div style={{ position: "absolute", bottom: 24, fontFamily: "Georgia, serif", fontSize: 10, color: `${accent}60`, letterSpacing: "0.15em" }}>◆</div>
    </div>
  );
}

function DividerPage({ category, accent }: { category: ProductCategory, accent: string }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "#F9F4E8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 10, border: `1px solid ${accent}20`, borderRadius: 4, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 32, left: 32, right: 32, height: 1, background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />
      <div style={{ fontSize: 52, marginBottom: 16 }}>🍽️</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 10, letterSpacing: "0.3em", color: `${accent}80`, textTransform: "uppercase", marginBottom: 10 }}>— Sección —</div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 400, color: "#2A1E08", textAlign: "center" }}>{category.name}</h2>
      <div style={{ width: 60, height: 1, background: `linear-gradient(to right, transparent, ${accent}, transparent)`, marginTop: 16 }} />
      <div style={{ position: "absolute", bottom: 32, left: 32, right: 32, height: 1, background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />
    </div>
  );
}

function ProductsPage({ products, category, accent, onSelect, pageNum, currency }: { products: Product[], category: ProductCategory, accent: string, onSelect: (p: Product) => void, pageNum: number, currency: string }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#FEFAF0", padding: "20px 16px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: 12, borderBottom: `1px solid ${accent}25` }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: `${accent}80`, letterSpacing: "0.15em", textTransform: "uppercase" }}>{category.name}</span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: `${accent}50` }}>{pageNum}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => onSelect(product)}
            style={{
              background: "#fff", border: `1px solid ${accent}20`, borderRadius: 10, overflow: "hidden",
              cursor: "pointer", display: "flex", flexDirection: "column",
              transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ height: 80, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, flexShrink: 0, position: "relative" }}>
              {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} /> : '🛍️'}
              <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 6px", fontSize: 8, color: "#fff", fontWeight: 600 }}>4D ✦</div>
            </div>
            <div style={{ padding: "8px 9px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 700, color: "#2A1E08", lineHeight: 1.3 }}>{product.name}</div>
              <div style={{ fontSize: 10, color: "#888", lineHeight: 1.4, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.description}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: accent, marginTop: 2 }}>{formatCurrency(product.price, currency)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackPage({ business, accent }: { business: Business, accent: string }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "#1A1208",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32,
    }}>
      <div style={{ position: "absolute", inset: 12, border: `1px solid ${accent}30`, borderRadius: 8, pointerEvents: "none" }} />
      <div style={{ fontSize: 32, marginBottom: 20 }}>🍽️</div>
      <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: `${accent}90`, textAlign: "center", lineHeight: 1.8 }}>"Que el alimento sea<br />tu medicina."</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: `${accent}50`, marginTop: 12 }}>— Hipócrates</div>
      <div style={{ position: "absolute", bottom: 24, fontSize: 10, color: `${accent}40` }}>shopflow.app/{business.slug}</div>
    </div>
  );
}

// ─── Main MenuBook ─────────────────────────────────────────────────────────────

interface MenuBookProps {
  business: Business;
  products: Product[];
  categories: ProductCategory[];
  onAddToCart: (p: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
  totalAmount: number;
}

export default function MenuBook({ business, products, categories, onAddToCart, cartCount, onOpenCart, totalAmount }: MenuBookProps) {
  const accent = business.accentColor;
  
  // FLAT PAGES for mobile (one by one) - useMemo ensures it updates when categories/products load
  const pages = useMemo(() => {
    const p: any[] = [{ type: "cover" }];
    for (const cat of categories) {
      const catProducts = products.filter(pr => pr.categoryId === cat.id);
      if (catProducts.length === 0) continue;
      p.push({ type: "divider", category: cat });
      for (let i = 0; i < catProducts.length; i += 4) {
        p.push({ type: "products", products: catProducts.slice(i, i + 4), category: cat });
      }
    }
    p.push({ type: "back" });
    return p;
  }, [categories, products]);

  const [pageIdx, setPageIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"forward" | "backward" | null>(null);
  const [nextPageIdx, setNextPageIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartPop, setCartPop] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function flip(dir: "forward" | "backward") {
    if (flipping) return;
    const next = pageIdx + (dir === "forward" ? 1 : -1);
    if (next < 0 || next >= pages.length) return;
    setFlipDir(dir);
    setNextPageIdx(next);
    setFlipping(true);
    setTimeout(() => {
      setPageIdx(next);
      setFlipping(false);
      setNextPageIdx(null);
      setFlipDir(null);
    }, 700);
  }

  function jumpToSection(categoryName: string) {
    const targetIdx = pages.findIndex(p => p.type === "divider" && p.category.name === categoryName);
    if (targetIdx !== -1 && targetIdx !== pageIdx) {
      setDrawerOpen(false);
      setFlipDir(targetIdx > pageIdx ? "forward" : "backward");
      setNextPageIdx(targetIdx);
      setFlipping(true);
      setTimeout(() => {
        setPageIdx(targetIdx);
        setFlipping(false);
        setNextPageIdx(null);
        setFlipDir(null);
      }, 700);
    }
  }

  function handleAddToCart(product: Product) {
    onAddToCart(product);
    setCartPop(true);
    setTimeout(() => setCartPop(false), 2000);
  }

  function renderPageContent(page: any, num: number) {
    if (!page) return null;
    switch (page.type) {
      case "cover":    return <CoverPage business={business} accent={accent} />;
      case "divider":  return <DividerPage category={page.category} accent={accent} />;
      case "products": return <ProductsPage products={page.products} category={page.category} accent={accent} onSelect={setSelected} pageNum={num} currency={business.currency} />;
      case "back":     return <BackPage business={business} accent={accent} />;
      default:         return null;
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(to bottom, #120c08, #000)",
      display: "flex", flexDirection: "column",
      zIndex: 1000, overflow: "hidden",
    }}>
      {/* Top Bar */}
      <div style={{
        padding: "env(safe-area-inset-top, 20px) 20px 15px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "rgba(255,255,255,0.08)", border: "none",
              borderRadius: 8, padding: "8px", color: accent, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 18 }}>
              <div style={{ height: 2, background: accent, borderRadius: 2 }} />
              <div style={{ height: 2, background: accent, borderRadius: 2, width: '70%' }} />
              <div style={{ height: 2, background: accent, borderRadius: 2 }} />
            </div>
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#F5E6C8", fontFamily: "Georgia, serif" }}>{business.name}</div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={onOpenCart}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%", width: 40, height: 40, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ShoppingCart size={18} />
          </button>
          {cartPop && (
            <div style={{
              position: "absolute", top: 45, right: 0, background: accent, color: "#fff",
              borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 700,
              animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>✓ Listoo!</div>
          )}
        </div>
      </div>

      {/* MOBILE BOOK VIEWPORT */}
      <div style={{
        flex: 1, position: "relative",
        padding: "20px 25px 40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        perspective: "2000px",
      }}>
        <div style={{
          width: "100%", height: "100%", maxWidth: 380, maxHeight: 600,
          position: "relative", transformStyle: "preserve-3d",
        }}>
          {/* Base Page (Static) with Ondulación Technique */}
          <div style={{
            position: "absolute", inset: 0, background: "#fff", borderRadius: 12,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            transformOrigin: "left center",
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIdx}
                initial={{ opacity: 0, rotateY: -15, x: -25 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, x: 25 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden" }}
              >
                {renderPageContent(pages[pageIdx], pageIdx + 1)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Flipping Layer */}
          {flipping && nextPageIdx !== null && (
            <div 
              className="flipping-page-container"
              style={{
                position: "absolute", inset: 0,
                transformOrigin: flipDir === "forward" ? "left center" : "right center",
                transformStyle: "preserve-3d",
                animation: `appleFlip${flipDir === "forward" ? "Fwd" : "Bwd"} 0.7s cubic-bezier(0.075, 0.82, 0.165, 1) both`,
                zIndex: 50,
              }}
            >
              {/* Current Page Surface */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden", zIndex: 2, background: "#fff", borderRadius: 12,
              }}>
                {renderPageContent(pages[pageIdx], pageIdx + 1)}
                 <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(${flipDir === "forward" ? "to right" : "to left"}, transparent 0%, rgba(0,0,0,0.2) 100%)`,
                  animation: "curlLightingFwd 0.7s ease-in-out both",
                }} />
              </div>

              {/* Next Page Back Surface */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)",
                zIndex: 1, background: "#f5f5f5", borderRadius: 12, overflow: "hidden",
              }}>
                 <div style={{ opacity: 0.9 }}>
                  {renderPageContent(pages[nextPageIdx], nextPageIdx + 1)}
                </div>
                 <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(${flipDir === "forward" ? "to left" : "to right"}, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.4) 20%, transparent 60%)`,
                }} />
              </div>
            </div>
          )}

          {/* Background thickness simulation (layers of paper underneath) */}
          <div style={{ position: "absolute", bottom: -6, left: 4, right: 4, height: 6, background: "#ddd", borderRadius: "0 0 12px 12px", borderTop: "1px solid #ccc", zIndex: -1 }} />
          <div style={{ position: "absolute", bottom: -12, left: 8, right: 8, height: 6, background: "#bbb", borderRadius: "0 0 12px 12px", borderTop: "1px solid #aaa", zIndex: -2 }} />
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{
        padding: "0 20px calc(env(safe-area-inset-bottom, 20px) + 20px)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 30,
      }}>
        <button
          onClick={() => flip("backward")}
          disabled={pageIdx === 0 || flipping}
          style={{ background: "none", border: "none", color: pageIdx === 0 ? "rgba(255,255,255,0.05)" : "#fff", fontSize: 24 }}
        >‹</button>

        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: "10px 18px", borderRadius: 20 }}>
          <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>{pageIdx + 1}</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/ {pages.length}</span>
        </div>

        <button
          onClick={() => flip("forward")}
          disabled={pageIdx >= pages.length - 1 || flipping}
          style={{ background: "none", border: "none", color: pageIdx >= pages.length - 1 ? "rgba(255,255,255,0.05)" : "#fff", fontSize: 24 }}
        >›</button>
      </div>

      {/* ── IMMERSIVE CONTROL PANEL (CATEGORY DRAWER) ── */}
      {drawerOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => setDrawerOpen(false)}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: "80%", maxWidth: 300, background: "#1A1208",
            borderRight: `2px solid ${accent}40`,
            display: "flex", flexDirection: "column",
            animation: "slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "40px 24px 20px", borderBottom: `1px solid ${accent}20` }}>
              <div style={{ fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>Menú Principal</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F5E6C8", fontFamily: "Georgia, serif" }}>Índice</div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
              {pages.map((p, i) => {
                if (p.type !== "divider") return null;
                return (
                  <button
                    key={i}
                    onClick={() => jumpToSection(p.category.name)}
                    style={{
                      width: "100%", padding: "16px 24px",
                      background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 15,
                      cursor: "pointer", transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(245,230,200,0.85)", fontFamily: "Georgia, serif" }}>
                      {p.category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: "20px 24px", background: "rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 10, color: "rgba(245,230,200,0.3)", letterSpacing: "0.05em" }}>SHOPFLOW v2.0</div>
            </div>
          </div>
        </div>
      )}

      {/* 4D Product View Modal */}
      {selected && (
        <Modal4D 
          product={selected} 
          onClose={() => setSelected(null)} 
          onAddToCart={handleAddToCart}
          accent={accent}
          currency={business.currency}
        />
      )}

      <style>{`
        @keyframes appleFlipFwd {
          0% { transform: perspective(2500px) rotateY(0deg); }
          100% { transform: perspective(2500px) rotateY(-180deg); }
        }
        @keyframes appleFlipBwd {
          0% { transform: perspective(2500px) rotateY(0deg); }
          100% { transform: perspective(2500px) rotateY(180deg); }
        }
        @keyframes curlLightingFwd {
          0%   { background-position: -200% 0; opacity: 0; }
          30%  { opacity: 0.4; }
          50%  { background-position: 50% 0; opacity: 0.8; }
          70%  { opacity: 0.4; }
          100% { background-position: 200% 0; opacity: 0; }
        }
        @keyframes popIn {
          0%   { opacity:0; transform: translateY(8px) scale(0.9); }
          100% { opacity:1; transform: translateY(0) scale(1); }
        }

        .flipping-page-container {
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.2),
            0 5px 15px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
