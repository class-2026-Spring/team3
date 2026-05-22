-- 충전소 실시간 상태 테이블
CREATE TABLE IF NOT EXISTS charger_status (
  id TEXT PRIMARY KEY,          -- 'statId_chgerId' 형태
  stat_id TEXT NOT NULL,        -- statId (충전소 ID)
  chger_id TEXT NOT NULL,       -- chgerId (충전기 번호)
  stat TEXT NOT NULL DEFAULT '9', -- 상태값 (2: 사용가능, 3: 충전중, 4: 운영중지, 5: 점검중, 9: 미확인)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charger_status REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_charger_status_stat_id ON charger_status(stat_id);
