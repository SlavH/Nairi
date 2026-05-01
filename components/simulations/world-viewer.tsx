'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky, Stars, Text, Float, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface WorldSpec {
  name: string
  description: string
  skybox: {
    type: string
    topColor: string
    bottomColor: string
    fogColor: string
    fogDensity: number
  }
  lighting: {
    ambient: { color: string; intensity: number }
    directional: { color: string; intensity: number; position: [number, number, number] }
    hemisphere: { skyColor: string; groundColor: string; intensity: number }
  }
  terrain: {
    type: string
    color: string
    size: [number, number]
    heightScale: number
    useNoise: boolean
  }
  objects: Array<{
    type: string
    name: string
    position: [number, number, number]
    scale: [number, number, number]
    rotation: [number, number, number]
    color: string
    material: string
    count: number
    spreadRadius: number
  }>
  atmosphere: {
    particles: {
      type: string
      count: number
      color: string
      size: number
    }
  }
  water: {
    enabled: boolean
    color: string
    position: [number, number, number]
    size: [number, number]
  }
  camera: {
    startPosition: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  metadata?: {
    mode?: string
    style?: string
    backend?: string
    gpu?: string
  }
}

interface WorldViewerProps {
  world: WorldSpec
  onExit?: () => void
}

function simpleNoise2D(x: number, z: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, z: number, scale: number): number {
  const sx = x / scale
  const sz = z / scale
  const ix = Math.floor(sx)
  const iz = Math.floor(sz)
  const fx = sx - ix
  const fz = sz - iz

  const a = simpleNoise2D(ix, iz)
  const b = simpleNoise2D(ix + 1, iz)
  const c = simpleNoise2D(ix, iz + 1)
  const d = simpleNoise2D(ix + 1, iz + 1)

  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)

  return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz
}

function terrainHeight(x: number, z: number, heightScale: number): number {
  let h = 0
  h += smoothNoise(x, z, 20) * heightScale
  h += smoothNoise(x, z, 10) * heightScale * 0.5
  h += smoothNoise(x, z, 5) * heightScale * 0.25
  return h
}

function TerrainGeometry({ size, heightScale }: { size: [number, number]; heightScale: number }) {
  const segments = 128
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size[0], size[1], segments, segments)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrainHeight(x, z, heightScale))
    }
    geo.computeVertexNormals()
    return geo
  }, [size, heightScale])

  return <primitive object={geometry} />
}

function Terrain({ terrain }: { terrain: WorldSpec['terrain'] }) {
  return (
    <mesh receiveShadow>
      <TerrainGeometry size={terrain.size} heightScale={terrain.heightScale} />
      <meshStandardMaterial
        color={terrain.color}
        roughness={0.9}
        metalness={0.1}
        flatShading={false}
      />
    </mesh>
  )
}

function Tree({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  const y = terrainHeight(position[0], position[2], 3)
  return (
    <group position={[position[0], y, position[2]]} scale={scale}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[1.2, 3, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 5, 0]}>
        <coneGeometry args={[0.9, 2.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  const y = terrainHeight(position[0], position[2], 3)
  return (
    <mesh castShadow position={[position[0], y + scale[1] * 0.3, position[2]]} scale={scale}>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

function Building({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  const y = terrainHeight(position[0], position[2], 3)
  return (
    <group position={[position[0], y, position[2]]} scale={scale}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[0.8, 0.5, 4]} />
        <meshStandardMaterial color="#8B0000" roughness={0.8} />
      </mesh>
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0.51]}>
          <planeGeometry args={[0.2, 0.3]} />
          <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  const y = terrainHeight(position[0], position[2], 3)
  return (
    <group position={[position[0], y, position[2]]} scale={scale}>
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 4]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Lamp({ position }: { position: [number, number, number] }) {
  const y = terrainHeight(position[0], position[2], 3)
  return (
    <group position={[position[0], y, position[2]]}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 3, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#FFD700" intensity={2} distance={8} position={[0, 3, 0]} />
    </group>
  )
}

function WorldObject({ obj }: { obj: WorldSpec['objects'][0] }) {
  const Component = (() => {
    switch (obj.type) {
      case 'tree': return <Tree position={obj.position} scale={obj.scale} color={obj.color} />
      case 'rock': return <Rock position={obj.position} scale={obj.scale} color={obj.color} />
      case 'building': return <Building position={obj.position} scale={obj.scale} color={obj.color} />
      case 'plant': return <Plant position={obj.position} scale={obj.scale} color={obj.color} />
      case 'lamp': return <Lamp position={obj.position} />
      default:
        const y = terrainHeight(obj.position[0], obj.position[2], 3)
        return (
          <mesh castShadow position={[obj.position[0], y + obj.scale[1] * 0.5, obj.position[2]]} scale={obj.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={obj.color} roughness={0.7} metalness={0.3} />
          </mesh>
        )
    }
  })()

  if (obj.count > 1 && obj.spreadRadius > 0) {
    return (
      <>
        {Component}
        {Array.from({ length: obj.count - 1 }).map((_, i) => {
          const angle = (i / (obj.count - 1)) * Math.PI * 2
          const radius = obj.spreadRadius * (0.5 + Math.random() * 0.5)
          const pos: [number, number, number] = [
            obj.position[0] + Math.cos(angle) * radius,
            obj.position[1],
            obj.position[2] + Math.sin(angle) * radius,
          ]
          const spreadObj = { ...obj, position: pos }
          return <WorldObject key={`${obj.name}-${i}`} obj={spreadObj} />
        })}
      </>
    )
  }

  return Component
}

function Particles({ particles }: { particles: { type: string; count: number; color: string; size: number } }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(particles.count * 3)
    for (let i = 0; i < particles.count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = Math.random() * 15 + 1
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return pos
  }, [particles.count])

  const velocities = useRef<Float32Array>(
    new Float32Array(particles.count).fill(0).map(() => (Math.random() - 0.5) * 0.02)
  )

  useFrame(() => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position
    for (let i = 0; i < particles.count; i++) {
      let y = pos.getY(i) + velocities.current[i]
      if (y > 16) y = 1
      if (y < 1) y = 16
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i) * 0.005)
    }
    pos.needsUpdate = true
  })

  if (particles.type === 'none') return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={particles.color}
        size={particles.size}
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  )
}

function Water({ water }: { water: WorldSpec['water'] }) {
  if (!water.enabled) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={water.position}>
      <planeGeometry args={water.size} />
      <MeshReflectorMaterial
        color={water.color}
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function WorldLights({ lighting }: { lighting: WorldSpec['lighting'] }) {
  return (
    <>
      <ambientLight color={lighting.ambient.color} intensity={lighting.ambient.intensity} />
      <directionalLight
        color={lighting.directional.color}
        intensity={lighting.directional.intensity}
        position={lighting.directional.position}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight
        args={[lighting.hemisphere.skyColor, lighting.hemisphere.groundColor, lighting.hemisphere.intensity]}
      />
    </>
  )
}

function PlayerController({ camera: cameraSpec }: { camera: { startPosition: [number, number, number]; target: [number, number, number]; fov: number } }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false })
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(...cameraSpec.startPosition)
    camera.fov = cameraSpec.fov
    camera.updateProjectionMatrix()
  }, [camera, cameraSpec])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = true; break
        case 'KeyS': case 'ArrowDown': moveState.current.backward = true; break
        case 'KeyA': case 'ArrowLeft': moveState.current.left = true; break
        case 'KeyD': case 'ArrowRight': moveState.current.right = true; break
        case 'Space': moveState.current.up = true; break
        case 'ShiftLeft': case 'ShiftRight': moveState.current.down = true; break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = false; break
        case 'KeyS': case 'ArrowDown': moveState.current.backward = false; break
        case 'KeyA': case 'ArrowLeft': moveState.current.left = false; break
        case 'KeyD': case 'ArrowRight': moveState.current.right = false; break
        case 'Space': moveState.current.up = false; break
        case 'ShiftLeft': case 'ShiftRight': moveState.current.down = false; break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const speed = 8
    const damping = 8
    const move = moveState.current

    direction.current.set(
      (move.right ? 1 : 0) - (move.left ? 1 : 0),
      (move.up ? 1 : 0) - (move.down ? 1 : 0),
      (move.backward ? 1 : 0) - (move.forward ? 1 : 0)
    )
    direction.current.normalize()

    if (move.forward || move.backward) velocity.current.z -= direction.current.z * speed * delta * damping
    if (move.left || move.right) velocity.current.x -= direction.current.x * speed * delta * damping
    if (move.up || move.down) velocity.current.y -= direction.current.y * speed * delta * damping

    velocity.current.x -= velocity.current.x * damping * delta
    velocity.current.y -= velocity.current.y * damping * delta
    velocity.current.z -= velocity.current.z * damping * delta

    camera.translateX(-velocity.current.x * delta * 10)
    camera.translateY(velocity.current.y * delta * 10)
    camera.translateZ(velocity.current.z * delta * 10)

    const y = terrainHeight(camera.position.x, camera.position.z, 3)
    if (camera.position.y < y + 2) {
      camera.position.y = y + 2
    }
  })

  return (
    <>
      <PointerLockControls
        ref={controlsRef}
        onLock={() => setIsLocked(true)}
        onUnlock={() => setIsLocked(false)}
      />
      {!isLocked && (
        <group>
          <Text
            position={[0, 2, -5]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            Click to explore
          </Text>
        </group>
      )}
    </>
  )
}

function WorldScene({ world }: { world: WorldSpec }) {
  return (
    <>
      <color attach="background" args={[world.skybox.bottomColor]} />
      <fog attach="fog" args={[world.skybox.fogColor, 5, 80]} />

      <WorldLights lighting={world.lighting} />

      <Terrain terrain={world.terrain} />

      <Water water={world.water} />

      {world.objects.map((obj, i) => (
        <WorldObject key={`${obj.name}-${i}`} obj={obj} />
      ))}

      <Particles particles={world.atmosphere.particles} />

      <PlayerController camera={world.camera} />
    </>
  )
}

export function WorldViewer({ world, onExit }: WorldViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden bg-black"
    >
      <Canvas
        shadows
        camera={{ fov: world.camera.fov, near: 0.1, far: 200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <WorldScene world={world} />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-lg drop-shadow-lg">{world.name}</h3>
        <p className="text-white/70 text-sm drop-shadow">{world.description}</p>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80">
          <p><span className="font-semibold">WASD</span> — Move</p>
          <p><span className="font-semibold">Mouse</span> — Look</p>
          <p><span className="font-semibold">Space</span> — Up</p>
          <p><span className="font-semibold">Shift</span> — Down</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {onExit && (
          <button
            onClick={onExit}
            className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white hover:bg-black/70 transition-colors"
          >
            ✕ Exit
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white hover:bg-black/70 transition-colors"
        >
          {isFullscreen ? '⊡ Windowed' : '⛶ Fullscreen'}
        </button>
      </div>

      {world.metadata && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/60 text-right">
            {world.metadata.backend && <p>{world.metadata.backend}</p>}
            {world.metadata.gpu && <p>{world.metadata.gpu}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
