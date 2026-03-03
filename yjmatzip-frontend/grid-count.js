// 브라우저 콘솔에 붙여넣어 실행
// 앱이 열려있는 탭에서 실행해야 카카오 SDK가 로드된 상태입니다

(async () => {
  const centerLat = 37.2975, centerLng = 126.9740
  const rows = 4, cols = 4, stepM = 300, radius = 350

  const latStep = stepM / 111000
  const lngStep = stepM / (111000 * Math.cos(centerLat * Math.PI / 180))

  const grid = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      grid.push({
        lat: centerLat + (r - (rows - 1) / 2) * latStep,
        lng: centerLng + (c - (cols - 1) / 2) * lngStep,
      })

  function fetchCount(p) {
    return new Promise(resolve => {
      const ps = new kakao.maps.services.Places()
      const loc = new kakao.maps.LatLng(p.lat, p.lng)
      let total = 0
      ps.categorySearch('FD6', (results, status, pagination) => {
        if (status === kakao.maps.services.Status.OK) {
          total += results.length
          if (pagination.hasNextPage) pagination.nextPage()
          else resolve(total)
        } else resolve(total)
      }, { location: loc, radius })
    })
  }

  console.log('16개 그리드 조회 중...')
  const counts = await Promise.all(grid.map(fetchCount))

  console.table(grid.map((p, i) => ({
    index: i,
    lat: p.lat.toFixed(4),
    lng: p.lng.toFixed(4),
    count: counts[i],
  })))

  console.log('\n--- App.tsx에 붙여넣을 코드 ---')
  console.log(`const GRID_WEIGHTS = [${counts.join(', ')}]`)
  console.log(`// 총 ${counts.reduce((a, b) => a + b, 0)}개 (중복 포함), 비어있는 그리드: ${counts.filter(c => c === 0).length}개`)
})()
