import "./../utilities/webgpuShim";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { loadImage } from "./../utilities/iconService";

const isDummyConnection = (node) =>
  !!node.accounts && (!node.type || !node.value || String(node.type).toLowerCase() === 'dummy');

const MapView = ({ nodes = [], links = [], onSelectAccount, selectedId, is3D, onToggle3D }) => {
  const [iconCache, setIconCache] = useState({});
  const fgRef = useRef();
  const isMobile = useMemo(() => window.innerWidth < 768, []);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    let isMounted = true;
    const loadIcons = async () => {
      const updates = {};
      for (const node of nodes) {
        if (!iconCache[node.id]) {
          try {
            const isConn = !!node.accounts;
            const iconKey = isConn ? (isDummyConnection(node) ? 'dummy' : node.type) : node.name;
            const img = await loadImage(iconKey);
            if (img && img.width > 0) updates[node.id] = img;
          } catch (e) {}
        }
      }
      if (isMounted && Object.keys(updates).length > 0) {
        setIconCache(prev => ({ ...prev, ...updates }));
      }
    };
    loadIcons();
    return () => { isMounted = false; };
  }, [nodes]);

  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n, id: String(n.id) })),
    links: links.map(l => ({
      ...l,
      source: typeof l.source === 'object' ? l.source.id : String(l.source),
      target: typeof l.target === 'object' ? l.target.id : String(l.target)
    }))
  }), [nodes, links]);

  // STABILIZATION & PHYSICS – 2D: tighter layout, less “active”, organic shapes (not a big circle)
  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;

      if (is3D) {
        // 3D: tighter layout, organic shapes (weaker center), less spread-out
        fg.d3Force("link").distance(20);
        fg.d3Force("charge").strength(-45);
        fg.d3Force("center").strength(0.25);
      } else {
        // 2D: shorter links (nodes stay closer), weaker repulsion & center so layout can form clusters/chains
        const linkDist = isMobile ? 28 : 36;
        const chargeStr = isMobile ? -35 : -50;
        fg.d3Force("link").distance(linkDist);
        fg.d3Force("charge").strength(chargeStr);
        fg.d3Force("center").strength(0.2); // low = nodes not pulled into one circle
      }

      // ONLY zoom on the very first time data loads – 2D: large padding so you see the whole graph
      if (initialLoadRef.current && nodes.length > 0) {
        setTimeout(() => {
          const padding = is3D ? 30 : 240;
          fg.zoomToFit(400, padding);
          initialLoadRef.current = false;
        }, 300);
      }
    }
  }, [graphData, is3D, isMobile]);

  // 3D: faster zoom in/out via controls (run after mount so controls exist)
  useEffect(() => {
    if (!is3D) return;
    const t = setTimeout(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const ctrl = typeof fg.controls === 'function' ? fg.controls() : fg.controls;
      if (ctrl && typeof ctrl.zoomSpeed !== 'undefined') {
        ctrl.zoomSpeed = 2.5;
      }
    }, 100);
    return () => clearTimeout(t);
  }, [is3D, graphData]);

  const handleCenter = () => {
    if (fgRef.current) fgRef.current.zoomToFit(600, is3D ? 20 : 40);
  };

  const getNodeThreeObject = useCallback((node) => {
    const isSelected = String(node.id) === String(selectedId);
    const isConn = !!node.accounts;
    const img = iconCache[node.id];
    const group = new THREE.Group();
    
    const baseSize = isConn ? (isMobile ? 12 : 8) : (isMobile ? 8 : 5);
    const hitBoxSize = isMobile ? baseSize * 2 : (isConn ? 12 : 9);
    
    const hitBox = new THREE.Mesh(
      new THREE.SphereGeometry(hitBoxSize),
      new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 })
    );
    group.add(hitBox);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(baseSize),
      new THREE.MeshLambertMaterial({ 
        color: isSelected ? "#3b82f6" : (isConn ? "#1e1e1e" : "#ffffff"),
        transparent: true, opacity: 0.9 
      })
    );
    group.add(sphere);

    if (img) {
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      const spriteScale = isConn ? (isMobile ? 16 : 10) : (isMobile ? 12 : 7);
      sprite.scale.set(spriteScale, spriteScale, 1);
      group.add(sprite);
    }

    // Only show labels for connections (not accounts) to avoid clutter; account names show on hover
    if (isConn) {
      const labelText = (isDummyConnection(node) ? 'No connection' : (node.type || '')).toUpperCase();
      const label = new SpriteText(labelText);
      label.color = isSelected ? "#3b82f6" : "#60a5fa";
      label.textHeight = isMobile ? 4 : 3;
      label.fontWeight = "700";
      label.position.y = -(baseSize + 6);
      label.raycast = () => null;
      group.add(label);
    }

    return group;
  }, [selectedId, iconCache, isMobile]);

  return (
    <div id="graph-container" className="w-full h-full relative bg-[#0a0a0a] overflow-hidden">
      {onToggle3D && (
        <button
          type="button"
          onClick={onToggle3D}
          className="absolute top-4 left-4 z-[100] bg-blue-600 border border-white/20 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 active:scale-95 transition-all"
        >
          → {is3D ? "2D" : "3D"}
        </button>
      )}
      <button 
        onClick={handleCenter}
        title="Center and fit graph"
        aria-label="Center and fit graph"
        className="absolute bottom-6 right-6 z-[100] bg-blue-600 border border-white/20 text-white p-4 rounded-full shadow-lg active:scale-90 transition-all hover:bg-blue-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/></svg>
      </button>
      <p className="absolute top-4 right-4 z-[100] text-[10px] text-white/50 pointer-events-none">
        {is3D ? 'Drag to rotate · Scroll to zoom · Drag node to move' : 'Drag to pan · Scroll to zoom'}
      </p>

      {is3D ? (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="#0a0a0a"
          onNodeClick={(node) => onSelectAccount(node)}
          nodeLabel={(node) => {
            const isConn = !!node.accounts;
            return isConn ? (isDummyConnection(node) ? 'No connection' : (node.type || node.value || '')) : (node.name || '');
          }}
          nodeThreeObject={getNodeThreeObject}
          nodeThreeObjectExtend={false}
          enableNodeDrag={true}
          enableNavigationControls={true}
          showNavInfo={false}
          linkWidth={2}
          linkColor={() => "rgba(255, 255, 255, 0.14)"}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.006}
          hoverPrecision={8}
        />
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="#0a0a0a"
          onNodeClick={(node) => onSelectAccount(node)}
          nodeLabel={(node) => {
            const isConn = !!node.accounts;
            return isConn ? (isDummyConnection(node) ? 'No connection' : (node.type || node.value || '')) : (node.name || '');
          }}
          clickDistanceThreshold={25}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, isMobile ? 26 : 14, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isSelected = String(node.id) === String(selectedId);
            const isConn = !!node.accounts;
            const size = isConn ? (isMobile ? 18 : 12) : (isMobile ? 12 : 8);
            const img = iconCache[node.id];
            
            if (isSelected) {
              ctx.beginPath(); ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(59, 130, 246, 0.4)"; ctx.fill();
            }

            ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = isConn ? "#1e1e1e" : "#FFFFFF"; ctx.fill();

            if (img && img.width > 0) {
              const iconSize = size * 0.7;
              ctx.drawImage(img, node.x - iconSize, node.y - iconSize, iconSize * 2, iconSize * 2);
            }

            // Only show labels for connections (not accounts) to avoid overlap; account names show on hover
            if (isConn) {
              const label = (isDummyConnection(node) ? 'No connection' : (node.type || '')).toUpperCase();
              if (globalScale > 0.75 || isSelected) {
                const fontSize = (isMobile ? 8 : 11) / globalScale;
                ctx.font = `800 ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.fillStyle = isSelected ? "#3b82f6" : "#60a5fa";
                ctx.fillText(label, node.x, node.y + size + (isMobile ? 8 : 7));
              }
            }
          }}
          linkWidth={isMobile ? 2.5 : 3}
          linkColor={() => "rgba(255, 255, 255, 0.12)"}
        />
      )}
    </div>
  );
};

export default MapView;