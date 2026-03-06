// trigger ci num3
import { useEffect, useRef, useState } from 'react'
import { Map as KakaoMap, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk'
import './App.css'
import RestaurantCard from './components/RestaurantCard'
import type { Restaurant } from './types/restaurant'
import logo from './assets/logo.png'

function buildGrid(centerLat: number, centerLng: number, rows: number, cols: number, stepM: number) {
  const latStep = stepM / 111_000
  const lngStep = stepM / (111_000 * Math.cos((centerLat * Math.PI) / 180))
  const points: { lat: number; lng: number }[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      points.push({
        lat: centerLat + (r - (rows - 1) / 2) * latStep,
        lng: centerLng + (c - (cols - 1) / 2) * lngStep,
      })
  return points
}

const GRID = buildGrid(37.2975, 126.9740, 4, 4, 300)
const GRID_WEIGHTS = [8, 4, 6, 15, 45, 45, 34, 39, 60, 60, 45, 45, 45, 60, 45, 45]
const SEARCH_RADIUS = 350
const CACHE_PREFIX = 'yjmatzip_grid_'

function getOrCreateUuid(): string {
  let uuid = localStorage.getItem('visitor_uuid')
  if (!uuid) {
    uuid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('visitor_uuid', uuid)
  }
  return uuid
}

function App() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAOMAP_KEY,
    libraries: ['services'],
  })

  const [dau, setDau] = useState<number | null>(null)
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isRedraw, setIsRedraw] = useState(false)
  const [mapCenter, setMapCenter] = useState(GRID[5])
  const [slot, setSlot] = useState<{ prev: string | null; curr: string; key: number }>({ prev: null, curr: '', key: 0 })

  function fetchFromPoint(p: { lat: number; lng: number }): Promise<Restaurant[]> {
    const key = `${CACHE_PREFIX}${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`
    const cached = sessionStorage.getItem(key)
    if (cached) return Promise.resolve(JSON.parse(cached))

    return new Promise(resolve => {
      const ps = new window.kakao.maps.services.Places()
      const location = new window.kakao.maps.LatLng(p.lat, p.lng)
      const collected: Restaurant[] = []
      ps.categorySearch(
        'FD6',
        (results: Restaurant[], status: string, pagination: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            collected.push(...results)
            if (pagination.hasNextPage) pagination.nextPage()
            else {
              sessionStorage.setItem(key, JSON.stringify(collected))
              resolve(collected)
            }
          } else {
            sessionStorage.setItem(key, JSON.stringify(collected))
            resolve(collected)
          }
        },
        { location, radius: SEARCH_RADIUS },
      )
    })
  }

  useEffect(() => {
    const uuid = getOrCreateUuid()
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/visit?uuid=${uuid}`)
      .then(r => r.json())
      .then(data => { if (data.dau !== undefined) setDau(Number(data.dau)) })
      .catch(() => {})
  }, [])

  function pickGridByWeight(): number {
    const total = GRID_WEIGHTS.reduce((s, w) => s + w, 0)
    let rand = Math.random() * total
    for (let i = 0; i < GRID_WEIGHTS.length; i++) {
      rand -= GRID_WEIGHTS[i]
      if (rand <= 0) return i
    }
    return GRID_WEIGHTS.length - 1
  }

  function tickSlot(list: Restaurant[], finalPick: Restaurant, step: number, delay: number, prev: string | null) {
    const r = list[Math.floor(Math.random() * list.length)]
    setSlot({ prev, curr: r.place_name, key: Date.now() })
    if (step > 0) {
      setTimeout(() => tickSlot(list, finalPick, step - 1, Math.min(delay + 20, 220), r.place_name), delay)
    } else {
      setTimeout(() => {
        setSlot({ prev: r.place_name, curr: finalPick.place_name, key: Date.now() + 1 })
        setTimeout(() => {
          setSelected(finalPick)
          setMapCenter({ lat: parseFloat(finalPick.y) + 0.0015, lng: parseFloat(finalPick.x) })
          setIsAnimating(false)
        }, 350)
      }, delay)
    }
  }

  async function pickRandom() {
    if (isAnimating || isSearching || loading || error) return

    const gridIdx = pickGridByWeight()
    setIsSearching(true)
    const results = await fetchFromPoint(GRID[gridIdx])
    setIsSearching(false)

    if (results.length === 0) return
    const pick = results[Math.floor(Math.random() * results.length)]

    if (selected !== null) {
      // 다시 뽑기: 룰렛 없이 바로 결과 교체
      setIsRedraw(true)
      setSelected(pick)
      setMapCenter({ lat: parseFloat(pick.y) + 0.0015, lng: parseFloat(pick.x) })
      return
    }

    setIsRedraw(false)
    setSelected(null)
    setIsAnimating(true)
    setSlot({ prev: null, curr: '', key: 0 })
    tickSlot(results, pick, 14, 60, null)
  }

  const canPick = !isSearching && !isAnimating && !loading && !error

  // 홈 카드 3D 틸트
  const homeCardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = homeCardRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = (e.clientX - rect.left) / rect.width - 0.5
    const dy = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: dy * -28, y: dx * 28 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
  }

  return (
    /* 전체 배경 */
    <div className="relative h-full overflow-hidden" style={{ background: '#080f0b' }}>

      {/* 배경 블롭 — 풀스크린 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,78,63,0.6) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-28 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(61,107,85,0.35) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,78,63,0.45) 0%, transparent 70%)' }} />
      </div>

      {/* 콘텐츠 — 모바일 기준, 데스크탑 중앙 고정 */}
      <div className="relative h-full flex flex-col" style={{ maxWidth: '430px', margin: '0 auto' }}>

        {/* ── 헤더 ── */}
        <header
          className="shrink-0 px-5 pb-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', background: '#080f0b' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="성균관대 로고" className="w-8 h-8 shrink-0 object-contain" />
              <div>
                <h1 className="text-sm font-semibold text-white leading-tight">율전캠 오늘 뭐 먹지?</h1>
                <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  성균관대 자연과학캠퍼스
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── 본문 ── */}
        <main className="flex-1 min-h-0 flex flex-col">

          {/* 홈 */}
          {!selected && !isAnimating && (
            <div
              ref={homeCardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="flex-1 flex flex-col items-center justify-center text-center px-6"
              style={{
                transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: tilt.x === 0 && tilt.y === 0
                  ? 'transform 0.6s cubic-bezier(0.23,1,0.32,1)'
                  : 'transform 0.08s ease',
                willChange: 'transform',
              }}
            >
              {isSearching ? (
                <>
                  <p className="text-3xl font-bold text-white mb-3">탐색 중...</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>주변 맛집을 불러오고 있어요</p>
                </>
              ) : (
                <>
                  <p className="font-bold mb-4 leading-tight"
                    style={{
                      fontSize: '2.6rem',
                      background: 'linear-gradient(135deg, #ffffff 10%, #3ecf8e 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                    오늘 뭐 먹지?
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    아래 버튼을 눌러 랜덤 맛집을 뽑아보세요
                  </p>
                  {dau !== null && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      오늘 <span style={{ color: 'rgba(62,207,142,0.7)' }}>{dau}명</span>이 뽑았어요
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* 뽑는 중 — 슬롯 */}
          {isAnimating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="flex gap-2 mb-6">
                {[0, 0.18, 0.36].map((delay, i) => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: '#3ecf8e', animation: `dotBounce 0.75s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
              <div className="relative h-10 w-full overflow-hidden">
                {slot.prev && (
                  <div key={`out-${slot.key}`} className="absolute inset-0 flex items-center justify-center"
                    style={{ animation: 'slotOut 0.13s cubic-bezier(0.4,0,1,1) forwards' }}>
                    <span className="text-xl font-bold truncate px-4 text-center"
                      style={{ color: 'rgba(255,255,255,0.25)' }}>{slot.prev}</span>
                  </div>
                )}
                <div key={`in-${slot.key}`} className="absolute inset-0 flex items-center justify-center"
                  style={{ animation: slot.prev ? 'slotIn 0.13s cubic-bezier(0,0,0.2,1) forwards' : 'none' }}>
                  <span className="text-xl font-bold text-white truncate px-4 text-center">{slot.curr}</span>
                </div>
              </div>
            </div>
          )}

          {/* 결과 화면 — 지도(가변) + 정보 패널(고정) */}
          {selected && !isAnimating && (
            <div className="flex-1 min-h-0 flex flex-col fade-up">

              {/* 지도 — 남은 공간 전부 */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {!loading && !error ? (
                  <KakaoMap center={mapCenter} style={{ width: '100%', height: '100%' }} level={4}>
                    <MapMarker
                      position={{ lat: parseFloat(selected.y), lng: parseFloat(selected.x) }}
                      title={selected.place_name}
                    />
                  </KakaoMap>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#0d1a14' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {error ? '지도를 불러오지 못했습니다' : '지도 로딩 중...'}
                    </p>
                  </div>
                )}
              </div>

              {/* 하단 정보 패널 — 항상 완전히 보임 */}
              <div
                key={selected.id}
                className={`${isRedraw ? 'card-redraw' : 'slide-up'} shrink-0`}
                style={{
                  background: '#0d1612',
                  boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
                }}
              >
                <RestaurantCard restaurant={selected} />
              </div>

            </div>
          )}
        </main>

        {/* ── 하단 버튼 ── */}
        <div
          className="shrink-0 px-4 pt-3"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
            background: '#080f0b',
          }}
        >
          <button
            onClick={() => pickRandom()}
            disabled={!canPick}
            className="btn-pick w-full py-4 font-bold rounded-2xl text-sm select-none"
          >
            {isSearching ? '맛집 탐색 중...' : isAnimating ? '뽑는 중...' : selected ? '다시 뽑기' : '랜덤 뽑기'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default App
