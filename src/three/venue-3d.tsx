import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import { useMemo, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import type { VenueSection, VenueFacility, EventSeatWithSeat } from '@/types/database';

interface Venue3DProps {
  sections: VenueSection[];
  facilities: VenueFacility[];
  eventSeats: EventSeatWithSeat[];
  selectedSeatIds: string[];
  onSeatClick: (eventSeatId: string) => void;
  focusedSectionId: string | null;
}

const statusColors: Record<string, string> = {
  available: '#10b981',
  held: '#f59e0b',
  booked: '#475569',
  reserved: '#8b5cf6',
  blocked: '#ef4444',
  unavailable: '#1e293b',
};

function Seat({ seat, position, color, selected, onClick }: {
  seat: EventSeatWithSeat;
  position: [number, number, number];
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const scale = selected ? 1.15 : hovered ? 1.1 : 1;
  return (
    <mesh
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      scale={scale}
    >
      <boxGeometry args={[0.35, 0.35, 0.35]} />
      <meshStandardMaterial
        color={selected ? '#06b6d4' : color}
        emissive={selected ? '#06b6d4' : hovered ? color : '#000000'}
        emissiveIntensity={selected ? 0.4 : hovered ? 0.2 : 0}
        transparent
        opacity={seat.status === 'booked' || seat.status === 'blocked' ? 0.5 : 0.95}
      />
    </mesh>
  );
}

function SectionBlock({ section, seats, selectedSeatIds, onSeatClick, focused }: {
  section: VenueSection;
  seats: EventSeatWithSeat[];
  selectedSeatIds: string[];
  onSeatClick: (id: string) => void;
  focused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pos: [number, number, number] = [
    Number(section.position_x),
    Number(section.position_y),
    Number(section.position_z),
  ];

  // group seats by row for layout
  const rows = useMemo(() => {
    const map = new Map<string, EventSeatWithSeat[]>();
    for (const s of seats) {
      const key = s.venue_seat?.row_id ?? 'default';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.values());
  }, [seats]);

  return (
    <group ref={groupRef} position={pos} rotation={[Number(section.rotation_x), Number(section.rotation_y), Number(section.rotation_z)]}>
      {/* Section label */}
      <Html position={[0, 1.5, 0]} center distanceFactor={12} occlude>
        <div className={`pointer-events-none whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ${focused ? 'bg-primary text-white' : 'bg-black/70 text-white'}`}>
          {section.name}
        </div>
      </Html>

      {/* Section floor */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[Math.max(seats.length / 4, 3), rows.length * 1.2 + 1]} />
        <meshStandardMaterial color={section.colour_code} transparent opacity={0.12} />
      </mesh>

      {/* Seats */}
      {rows.map((rowSeats, ri) =>
        rowSeats.map((seat, si) => {
          const x = (si - rowSeats.length / 2) * 0.5;
          const z = ri * 0.6;
          const color = statusColors[seat.status] ?? '#10b981';
          const selected = selectedSeatIds.includes(seat.id);
          return (
            <Seat
              key={seat.id}
              seat={seat}
              position={[x, 0, z]}
              color={color}
              selected={selected}
              onClick={() => onSeatClick(seat.id)}
            />
          );
        })
      )}
    </group>
  );
}

function Stage() {
  return (
    <group position={[0, 0, -2]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[10, 2, 1.5]} />
        <meshStandardMaterial color="#1e1b4b" emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[10, 0.3, 0.2]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} />
      </mesh>
      <Text
        position={[0, 1, 0.8]}
        fontSize={0.6}
        color="#a5b4fc"
        anchorX="center"
        anchorY="middle"
      >
        STAGE
      </Text>
    </group>
  );
}

function Facility({ facility }: { facility: VenueFacility }) {
  const pos: [number, number, number] = [
    Number(facility.position_x),
    Number(facility.position_y) + 0.5,
    Number(facility.position_z),
  ];
  const color = facility.is_emergency ? '#ef4444' : '#06b6d4';
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <Html position={[0, 0.8, 0]} center distanceFactor={14} occlude>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
          {facility.name}
        </div>
      </Html>
    </group>
  );
}

function Scene({ sections, facilities, eventSeats, selectedSeatIds, onSeatClick, focusedSectionId }: Venue3DProps) {
  const seatsBySection = useMemo(() => {
    const map = new Map<string, EventSeatWithSeat[]>();
    for (const s of eventSeats) {
      const sid = s.venue_seat?.section_id ?? '';
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(s);
    }
    return map;
  }, [eventSeats]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={0.8} intensity={0.8} castShadow />
      <pointLight position={[-15, 10, 10]} intensity={0.3} color="#6366f1" />
      <pointLight position={[15, 10, 10]} intensity={0.3} color="#06b6d4" />

      <Stage />

      {sections.map((s) => (
        <SectionBlock
          key={s.id}
          section={s}
          seats={seatsBySection.get(s.id) ?? []}
          selectedSeatIds={selectedSeatIds}
          onSeatClick={onSeatClick}
          focused={focusedSectionId === s.id}
        />
      ))}

      {facilities.map((f) => (
        <Facility key={f.id} facility={f} />
      ))}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 8]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#0a0a0f" transparent opacity={0.5} />
      </mesh>

      <OrbitControls
        enablePan
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 8]}
      />
    </>
  );
}

export function Venue3D(props: Venue3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 20], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={<Html center><div className="text-white text-sm">Loading 3D venue…</div></Html>}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
