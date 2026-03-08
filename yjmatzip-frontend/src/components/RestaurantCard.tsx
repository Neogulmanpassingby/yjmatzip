import type { Restaurant } from '../types/restaurant'

async function shareRestaurant(restaurant: Restaurant) {
  const text = `🍽️ 오늘 여기 어때?\n\n${restaurant.place_name}\n📍 ${restaurant.road_address_name || restaurant.address_name}${restaurant.phone ? `\n📞 ${restaurant.phone}` : ''}`
  if (navigator.share) {
    await navigator.share({ title: restaurant.place_name, text, url: restaurant.place_url })
  } else {
    await navigator.clipboard.writeText(`${text}\n${restaurant.place_url}`)
    alert('링크가 복사되었습니다!')
  }
}

function dividerStyle(rgb: string): React.CSSProperties {
  return {
    height: 1,
    background: `linear-gradient(90deg, rgba(${rgb},0.2) 0%, rgba(255,255,255,0.04) 100%)`,
    margin: '10px 0',
  }
}

interface Props { restaurant: Restaurant; accent?: string; accentRgb?: string }

export default function RestaurantCard({ restaurant, accent = '#3ecf8e', accentRgb = '62,207,142' }: Props) {
  return (
    <div className="px-4 pt-3 pb-3">

      {/* 라벨 + 공유 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
          background: `rgba(${accentRgb},0.12)`,
          border: `1px solid rgba(${accentRgb},0.28)`,
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill={accent}>
            <path d="M6 0L7.35 4.65L12 6L7.35 7.35L6 12L4.65 7.35L0 6L4.65 4.65L6 0Z"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: accent, letterSpacing: '0.04em' }}>
            오늘의 추천
          </span>
        </div>
        <button
          onClick={() => shareRestaurant(restaurant)}
          className="select-none p-1.5 flex items-center justify-center rounded-lg"
          style={{ color: 'rgba(255,255,255,0.35)', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = accent)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 14l11 -11" />
            <path d="M21 3l-6.5 18a0.55 0.55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 0.55 0 0 1 0 -1l18 -6.5" />
          </svg>
        </button>
      </div>

      {/* 이름 + 카테고리 */}
      <h2 className="text-base font-bold text-white leading-snug mb-0.5">{restaurant.place_name}</h2>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{restaurant.category_name}</p>

      <div style={dividerStyle(accentRgb)} />

      {/* 주소 + 전화 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {restaurant.road_address_name || restaurant.address_name}
          </span>
        </div>
        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{restaurant.phone}</span>
          </a>
        )}
      </div>

      {/* 카카오맵 버튼 */}
      <a
        href={restaurant.place_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold select-none"
        style={{ background: '#FAE100', color: '#1a1a1a', transition: 'opacity 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
        </svg>
        카카오맵에서 보기
      </a>

    </div>
  )
}
