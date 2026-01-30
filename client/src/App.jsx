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
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Link 
      to={to} 
      className={`
        group relative overflow-hidden flex items-start gap-5 p-6 border bg-black/70 rounded-xl
        transition-all duration-300 hover:scale-[1.02] hover:bg-black/80
        ${color === 'blue' ? 'border-neonBlue/30 hover:border-neonBlue hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]' : ''}
        ${color === 'red' ? 'border-neonRed/30 hover:border-neonRed hover:shadow-[0_0_20px_rgba(255,0,60,0.2)]' : ''}
        ${color === 'green' ? 'border-green-500/30 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]' : ''}
        ${color === 'yellow' ? 'border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''}
      `}
    >
      <div className={`
        shrink-0 p-3 rounded-md bg-opacity-10
        ${color === 'blue' ? 'bg-neonBlue text-neonBlue' : ''}
        ${color === 'red' ? 'bg-neonRed text-neonRed' : ''}
        ${color === 'green' ? 'bg-green-500 text-green-500' : ''}
        ${color === 'yellow' ? 'bg-yellow-500 text-yellow-500' : ''}
      `}>
        <Icon size={28} />
      </div>
      <div className="min-w-0">
        <h3 className={`font-black uppercase tracking-[0.14em] leading-tight text-base sm:text-lg mb-1 break-words ${
           color === 'blue' ? 'text-neonBlue' : 
           color === 'red' ? 'text-neonRed' : 
           color === 'green' ? 'text-green-400' : 'text-yellow-400'
        }`}>
          {title}
        </h3>
        <p className="text-gray-400 text-[11px] font-mono uppercase tracking-[0.22em] leading-relaxed break-words">
          {subtitle}
        </p>
      </div>
      
      {/* Glitch hover effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  </motion.div>
);

const Home = () => (
  <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8 bg-neutral-950">
    {/* Grid Background */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80" />
    
    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(520px,560px)] gap-14 lg:gap-24 relative z-10">
      {/* Left Column: Branding */}
      <div className="flex flex-col justify-center space-y-8 lg:pr-20 min-w-0">
        <div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-2 mb-4 text-neonRed animate-pulse"
          >
            <Radio className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold">System Status: Critical</span>
          </motion.div>
          
          <h1 className="text-[clamp(3rem,7vw,6rem)] font-black italic tracking-[-0.06em] leading-[0.9] whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-800 mb-2 glitch-text">
            CODE
          </h1>
          <h1 className="text-[clamp(2.6rem,6.5vw,6rem)] font-black italic tracking-[-0.06em] leading-[0.9] whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-neonRed via-red-500 to-purple-900 neon-text-red">
            APOCALYPSE
          </h1>
        </div>

        <p className="text-gray-400 text-lg border-l-2 border-neonBlue pl-4 max-w-md font-mono leading-relaxed">
          The virus has breached the perimeter. Secure the labs. Dominate the war zones. <br/>
          <span className="text-neonBlue">Protocol: SURVIVE.</span>
        </p>

        <div className="flex gap-4 text-xs font-mono text-gray-500">
           <div>ID: <span className="text-gray-300">USER_GUEST</span></div>
           <div>LOC: <span className="text-gray-300">SECURE_ROOT</span></div>
           <div>VER: <span className="text-gray-300">2.0.4-BETA</span></div>
        </div>
      </div>

      {/* Right Column: Menu Grid */}
      <div className="space-y-4 lg:pl-16 lg:border-l lg:border-gray-800/60">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 border-b border-gray-800 pb-2">Access Terminals</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MenuTile 
            to="/lab/1"
            title="Lab Monitor"
            subtitle="Public Display // Round 1"
            color="blue"
            icon={Terminal}
            delay={0.1}
          />
          <MenuTile 
            to="/admin-r1/1"
            title="Lab Command"
            subtitle="Admin Control // Round 1"
            color="green"
            icon={ShieldAlert}
            delay={0.2}
          />
          <MenuTile 
            to="/war-room"
            title="War Room"
            subtitle="Public Map // Round 2"
            color="red"
            icon={Skull}
            delay={0.3}
          />
           <MenuTile 
            to="/admin-r2"
            title="War Command"
            subtitle="Admin Control // Round 2"
            color="yellow"
            icon={Crosshair}
            delay={0.4}
          />
        </div>
        
        <MenuTile 
          to="/player"
          title="Field Operative"
          subtitle="Mobile Terminal // Player Access"
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
