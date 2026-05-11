const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

// Find the start of the return statement
const returnStart = content.indexOf('return (');

// We want to replace the whole return block.
const newReturn = `  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold text-sm">오류가 발생했습니다</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

      {/* MAP CONTAINER */}
      <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100/80 flex-1 min-h-[500px] flex flex-col md:flex-row overflow-hidden relative mt-2 mb-2">

        {loading && chargers.length === 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-bold text-gray-700">제주 지역 3,189개 충전소 위치를 불러오는 중...</p>
            <p className="mt-1 text-[11px] text-gray-500">잠시만 기다려주세요</p>
          </div>
        )}

        {!loading && statusLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-teal-100 flex items-center gap-2 pointer-events-none">
            <div className="w-3 h-3 border-[2.5px] border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
            <span className="text-[11px] font-bold text-teal-600 tracking-tight">실시간 상태 동기화 중...</span>
          </div>
        )}

        {/* Left/Main Side: Map + SearchBar */}
        <div className="flex-1 relative flex flex-col min-h-[400px]">
          <div className="relative z-10 w-full border-b border-gray-100">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              onSelectCharger={(c) => {
                setSelectedCharger(c);
                setActiveDistrict(c.district);
              }}
            />
          </div>

          <div className="flex-1 relative">
            <KakaoMap
              chargers={filteredChargers}
              activeDistrict={activeDistrict}
              setActiveDistrict={setActiveDistrict}
              selectedCharger={selectedCharger}
              setSelectedCharger={setSelectedCharger}
            />
          </div>

          {/* Selected Charger Card */}
          {selectedCharger && (() => {
            const stats = getStationStats(selectedCharger.chargers);
            const repStat = getStationRepresentativeStat(selectedCharger.chargers);

            return (
              <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[340px] md:right-auto z-20">
                <div className="bg-white rounded-[15px] shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[15px] font-bold text-gray-900 leading-tight">{selectedCharger.name}</p>
                      <button onClick={() => setSelectedCharger(null)} className="p-1.5 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{selectedCharger.address}</p>

                    <div className="bg-gray-50/80 rounded-xl p-3 mb-1 border border-gray-100/50">
                      <p className="text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        현재 충전 가능
                        <span className="w-2 h-2 rounded-full" style={{ background: getStatColor(repStat) }}></span>
                      </p>
                      <div className="flex items-center gap-3 text-[14px] font-medium">
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 text-xs font-semibold">급속</span>
                          <span className={stats.fastAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 font-extrabold"}>{stats.fastAvail}</span>
                          <span className="text-gray-400 text-[10px] mt-0.5">/ {stats.fastTotal}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200"></div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 text-xs font-semibold">완속</span>
                          <span className={stats.slowAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 font-extrabold"}>{stats.slowAvail}</span>
                          <span className="text-gray-400 text-[10px] mt-0.5">/ {stats.slowTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Side: ChargerList (Desktop) */}
        <div className="w-[320px] border-l border-gray-100 bg-white hidden md:flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-extrabold text-gray-800 text-[13px]">충전소 목록</h3>
            <p className="text-[11px] text-gray-500 mt-1">총 <span className="text-teal-500 font-bold">{filteredChargers.length}</span>개의 충전소가 있습니다.</p>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <ChargerList
                chargers={filteredChargers}
                districts={districts}
                activeDistrict={activeDistrict}
                setActiveDistrict={(d) => {
                  setActiveDistrict(d);
                  setSelectedCharger(null);
                }}
                chargeFilter={chargeFilter}
                setChargeFilter={setChargeFilter}
                onSelectCharger={setSelectedCharger}
              />
            </div>
          </div>
        </div>

        {/* Mobile List View Sheet */}
        <div className={\`
            md:hidden absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out
            bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-[20px]
            \${isListExpanded ? 'h-[65vh] translate-y-0' : 'h-[60px] translate-y-0'}
          \`}>
          <div
            className="w-full h-10 flex flex-col items-center justify-center cursor-pointer relative"
            onClick={() => setIsListExpanded(!isListExpanded)}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-1"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isListExpanded ? 'Close List' : 'View List'}</span>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-hidden relative border-t border-gray-50">
            <div className="absolute inset-0">
              <ChargerList
                chargers={filteredChargers}
                districts={districts}
                activeDistrict={activeDistrict}
                setActiveDistrict={(d) => {
                  setActiveDistrict(d);
                  setSelectedCharger(null);
                }}
                chargeFilter={chargeFilter}
                setChargeFilter={setChargeFilter}
                onSelectCharger={setSelectedCharger}
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
`;

fs.writeFileSync('app/page.tsx', content.substring(0, returnStart) + newReturn);
