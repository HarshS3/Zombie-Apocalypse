import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert, Skull, Smartphone, Crosshair, Radio } from 'lucide-react';
import Round1Lab from './screens/Round1Lab';
import Round1Admin from './screens/Round1Admin';
import Round2War from './screens/Round2War';
import Round2Player from './screens/Round2Player';
import Round2Admin from './screens/Round2Admin';

const MenuTile = ({ to, title, subtitle, color, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.2 }}
  >
    <Link 
      to={to} 
      className={`
        group relative flex items-center gap-4 p-4 mc-btn
        transition-all duration-100 active:scale-[0.98]
      `}
    >
      <div className={`
        shrink-0 p-2 border-2 border-black bg-black/20
        ${color === 'blue' ? 'text-[#3C8DAB]' : ''}
        ${color === 'red' ? 'text-[#ff3333]' : ''}
        ${color === 'green' ? 'text-[#5b8731]' : ''}
        ${color === 'yellow' ? 'text-[#f0c330]' : ''}
      `}>
        <Icon size={32} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <h3 className="text-xl text-[#ffffff] text-shadow-[2px_2px_#3f3f3f]">
          {title}
        </h3>
        <p className="text-[#bfbfbf] text-sm uppercase tracking-wider text-shadow-[1px_1px_#202020]">
          {subtitle}
        </p>
      </div>
    </Link>
  </motion.div>
);

const Home = () => (
  <div className="min-h-screen relative flex items-center justify-center p-8">
    
    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(520px,560px)] gap-14 lg:gap-24 relative z-10">
      {/* Left Column: Branding */}
      <div className="flex flex-col justify-center space-y-8 lg:pr-20 min-w-0">
        <div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-2 mb-4 text-[#ff3333] animate-pulse"
          >
            <Radio className="w-6 h-6" />
            <span className="text-lg uppercase tracking-widest font-bold text-shadow-[2px_2px_#3f0000]">System Status: Crit</span>
          </motion.div>
          
          <h1 className="text-[5rem] leading-none mb-4 text-[#bfbfbf] text-shadow-[4px_4px_#3f3f3f]">
            CODE
          </h1>
          <h1 className="text-[5rem] leading-none text-[#ff3333] text-shadow-[4px_4px_#3f0000]">
            APOCALYPSE
          </h1>
        </div>

        <div className="mc-panel p-6 text-black">
          <p className="text-xl mb-4 font-bold">
            The virus has breached the overworld. Secure the secure chunks. Dominate the biomes.
          </p>
          <p className="text-[#3C8DAB] font-bold text-xl uppercase text-shadow-[1px_1px_#fff]">
             Protocol: SURVIVE NIGHT
          </p>
        </div>

        <div className="flex gap-4 text-lg text-[#bfbfbf] text-shadow-[1px_1px_#000]">
           <div>ID: <span className="text-[#ffffff]">Steve</span></div>
           <div>LOC: <span className="text-[#ffffff]">X: -264 Y: 64 Z: 120</span></div>
           <div>VER: <span className="text-[#ffffff]">1.20.4</span></div>
        </div>
      </div>

      {/* Right Column: Menu Grid */}
      <div className="space-y-4 lg:pl-16">
        <h2 className="text-xl text-[#bfbfbf] uppercase tracking-widest mb-6 border-b-4 border-[#3f3f3f] pb-2 text-shadow-[2px_2px_#000]">
          Select World
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MenuTile 
            to="/lab/1"
            title="Lab Monitor"
            subtitle="Obsidian Display"
            color="blue"
            icon={Terminal}
            delay={0.1}
          />
          <MenuTile 
            to="/admin-r1/1"
            title="Lab Command"
            subtitle="OP Access"
            color="green"
            icon={ShieldAlert}
            delay={0.2}
          />
          <MenuTile 
            to="/war-room"
            title="War Room"
            subtitle="PVP Arena"
            color="red"
            icon={Skull}
            delay={0.3}
          />
           <MenuTile 
            to="/admin-r2"
            title="War Command"
            subtitle="Server Console"
            color="yellow"
            icon={Crosshair}
            delay={0.4}
          />
        </div>
        
        <MenuTile 
          to="/player"
          title="Field Operative"
          subtitle="Mobile Inventory"
          color="blue"
          icon={Smartphone}
          delay={0.5}
        />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lab/:labId" element={<Round1Lab />} />
        <Route path="/admin-r1/:labNumber" element={<Round1Admin />} />
        <Route path="/war-room" element={<Round2War />} />
        <Route path="/player" element={<Round2Player />} />
        <Route path="/admin-r2" element={<Round2Admin />} />
      </Routes>
    </div>
  );
}

export default App;
