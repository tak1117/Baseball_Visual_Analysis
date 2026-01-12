import numpy as np
import pandas as pd
from scipy.optimize import fsolve
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon
from pybaseball import statcast_pitcher, playerid_lookup
import os

# ========================================
# 設定
# ========================================
# 身長範囲 (cm単位で指定、m単位に変換)
BATTER_HEIGHT_MIN = 160  # cm
BATTER_HEIGHT_MAX = 200  # cm

# 物理定数
G = 9.81  # 重力加速度 (m/s^2)
MPH2MS = 0.44704  # mph → m/s
IN2M = 0.0254  # inch → m

# リリースポイント
RELEASE = np.array([-0.656, 16.33, 1.73])  # x, y, z (y=投手方向, z=高さ)

# 軌道終端
Y_END = -1.0  # キャッチャー方向 -1m まで

# 出力周波数
OUTPUT_HZ = 1500

# ストライクゾーン幅
SZ_WIDTH_IN = 17  # inches

# 投球設定
PITCHES = [
    ("FF", "Shohei", "Ohtani", "FF", 2023, "#E63946", None),
    ("ST", "Shohei", "Ohtani", "ST", 2023, "#457B9D", None),
    ("CU", "Clayton", "Kershaw", "CU", 2023, "#9B59B6", None),
    ("SI", "Dustin", "May", "SI", 2023, "#2A9D8F", "ST"),
]


def get_strike_zone(batter_height_m):
    """バッター身長に基づくストライクゾーン計算"""
    sz_width = SZ_WIDTH_IN * IN2M
    sz_left = -sz_width / 2
    sz_bottom = batter_height_m * 0.27
    sz_top = batter_height_m * 0.535
    sz_height = sz_top - sz_bottom
    return {
        'width': sz_width,
        'left': sz_left,
        'bottom': sz_bottom,
        'top': sz_top,
        'height': sz_height
    }


def get_courses(batter_height_m):
    """バッター身長に基づくコース座標を生成"""
    # z座標（高さ）の係数
    z_coeffs = [('high', 0.490), ('mid', 0.405), ('low', 0.314)]
    # x座標（横位置）
    x_coords = [('in', -0.144), ('mid', 0.00), ('out', 0.144)]
    
    courses = {}
    for v, z_coeff in z_coeffs:
        for h, x in x_coords:
            course_name = f'{v}_{h}'
            # x=横, y=奥行き(通過点), z=高さ
            courses[course_name] = np.array([x, 0.216, batter_height_m * z_coeff])
    return courses


def get_pitch_data(first, last, pitch_type, year):
    """Statcastからピッチデータを取得"""
    pid = int(playerid_lookup(last, first).iloc[0]['key_mlbam'])
    df = statcast_pitcher(f"{year}-03-01", f"{year}-11-30", pid)
    df = df[df['pitch_type'] == pitch_type].dropna(subset=['pfx_x', 'pfx_z', 'release_speed'])
    df['total'] = df['pfx_x'].abs() + df['pfx_z'].abs()
    p = df.loc[df['total'].idxmax()]
    return {
        'speed': p['release_speed'],
        'pfx_x': p['pfx_x'] * 12,  # feet → inches
        'pfx_z': p['pfx_z'] * 12,
        'date': str(p['game_date']),
        'count': len(df)
    }


def generate_trajectory(speed_mph, pfx_x_in, pfx_z_in, pass_through, dt):
    """
    軌道生成
    座標系: x=横方向, y=奥行き(投手→捕手方向が負), z=高さ
    """
    v = speed_mph * MPH2MS
    px = pfx_x_in * IN2M  # x方向の変化量
    pz = pfx_z_in * IN2M  # z方向の変化量
    
    x0, y0, z0 = RELEASE  # リリースポイント
    xp, yp, zp = pass_through  # 通過点
    
    def equations(p):
        T, vy = p
        if T <= 0.01:
            return [1e10, 1e10]
        # 加速度（変化量から逆算）
        ax = 2 * px / T**2
        az = 2 * pz / T**2
        # 初速度計算
        vx = (xp - x0 - 0.5 * ax * T**2) / T
        vz = (zp - z0 - 0.5 * (az - G) * T**2) / T
        # 方程式: y座標と速度の整合性
        return [y0 + vy * T - yp, np.sqrt(vx**2 + vy**2 + vz**2) - v]
    
    # 初期推定値
    T_guess = abs(yp - y0) / v
    vy_guess = (yp - y0) / T_guess if T_guess > 0 else -v
    
    T_pass, vy = fsolve(equations, [T_guess, vy_guess])
    
    # 加速度と初速度を計算
    ax = 2 * px / T_pass**2
    az = 2 * pz / T_pass**2
    vx = (xp - x0 - 0.5 * ax * T_pass**2) / T_pass
    vz = (zp - z0 - 0.5 * (az - G) * T_pass**2) / T_pass
    
    # 軌道生成
    trajectory = []
    t = 0.0
    while True:
        y = y0 + vy * t
        x = x0 + vx * t + 0.5 * ax * t**2
        z = z0 + vz * t + 0.5 * (az - G) * t**2
        trajectory.append([t, x, y, z])
        if y < Y_END:
            break
        t += dt
    
    return pd.DataFrame(trajectory, columns=['time_s', 'x_m', 'y_m', 'z_m'])


def save_csv(df, path):
    """CSVファイル保存"""
    df.to_csv(path, index=False)


def main():
    print("=" * 70)
    print("⚾ Statcastデータから投球軌道を生成")
    print("=" * 70)
    
    print(f"\n📏 バッター身長範囲: {BATTER_HEIGHT_MIN}cm ~ {BATTER_HEIGHT_MAX}cm")
    print(f"📊 出力周波数: {OUTPUT_HZ}Hz (dt = {1/OUTPUT_HZ:.6f}s)")
    print(f"🎯 軌道終端: y = {Y_END}m")
    
    # サンプル身長でコース表示
    sample_height = BATTER_HEIGHT_MIN / 100
    sample_courses = get_courses(sample_height)
    print(f"\n📍 コース設定 (身長{BATTER_HEIGHT_MIN}cmの例):")
    for name, coord in sample_courses.items():
        print(f"   {name:10}: x={coord[0]:+.3f}m, y={coord[1]:.3f}m, z={coord[2]:.3f}m")
    
    # Statcastデータ取得
    print("\n📊 Statcastデータ取得中...")
    pitch_data = {}
    for name, first, last, ptype, year, color, _ in PITCHES:
        print(f"  {name}...", end=" ")
        try:
            pitch_data[name] = get_pitch_data(first, last, ptype, year)
            d = pitch_data[name]
            print(f"✅ {d['speed']:.1f}mph, pfx:{d['pfx_x']:+.1f}/{d['pfx_z']:+.1f}in ({d['date']})")
        except Exception as e:
            print(f"❌ {e}")
    
    # 球速調整
    print("\n🔧 球速調整...")
    for name, _, _, _, _, _, ref in PITCHES:
        if ref and name in pitch_data and ref in pitch_data:
            old = pitch_data[name]['speed']
            pitch_data[name]['speed'] = pitch_data[ref]['speed']
            print(f"  {name}: {old:.1f} → {pitch_data[name]['speed']:.1f} mph ({ref})")
    
    # 出力設定
    dt = 1.0 / OUTPUT_HZ
    total_files = 0
    
    # 身長ごとにディレクトリ作成・軌道生成
    print("\n🎯 軌道生成中...")
    for height_cm in range(BATTER_HEIGHT_MIN, BATTER_HEIGHT_MAX + 1):
        height_m = height_cm / 100.0
        # height_dir を直接身長の数値に設定
        height_dir = f"{height_cm}"
        
        courses = get_courses(height_m)
        
        print(f"\n  📏 身長 {height_cm}cm:")
        
        for course_name, pass_through in courses.items():
            course_dir = os.path.join(height_dir, course_name)
            os.makedirs(course_dir, exist_ok=True)
            
            for pitch_name, _, _, _, _, _, _ in PITCHES:
                if pitch_name not in pitch_data:
                    continue
                
                d = pitch_data[pitch_name]
                traj = generate_trajectory(d['speed'], d['pfx_x'], d['pfx_z'], pass_through, dt)
                
                fpath = os.path.join(course_dir, f"{pitch_name}.csv")
                save_csv(traj, fpath)
                total_files += 1
            
        print(f"     ✅ 9コース × {len(pitch_data)}球種 生成完了")
    
    # サマリー
    print("\n" + "=" * 70)
    print("📊 生成結果サマリー")
    print("=" * 70)
    
    print("\n【球種データ】")
    print("| 球種 | 球速 | pfx_x | pfx_z | 日付 |")
    print("|------|------|-------|-------|------|")
    for n, d in pitch_data.items():
        print(f"| {n:4} | {d['speed']:5.1f} | {d['pfx_x']:+5.1f} | {d['pfx_z']:+5.1f} | {d['date']} |")
    
    n_heights = BATTER_HEIGHT_MAX - BATTER_HEIGHT_MIN + 1
    n_courses = 9
    n_pitches = len(pitch_data)
    
    print(f"\n📁 生成ファイル数: {total_files}ファイル")
    print(f"   - 身長: {n_heights}種類 ({BATTER_HEIGHT_MIN}cm ~ {BATTER_HEIGHT_MAX}cm)")
    print(f"   - コース: {n_courses}種類")
    print(f"   - 球種: {n_pitches}種類")
    print(f"   - 合計: {n_heights} × {n_courses} × {n_pitches} = {n_heights * n_courses * n_pitches}ファイル")
    
    print(f"\n📁 出力ディレクトリ構造:")
    print(f"   ./ (実行ディレクトリ)")
    print(f"   ├─ {BATTER_HEIGHT_MIN}/")
    print(f"   │   ├─ high_in/")
    for pitch_name in pitch_data.keys():
        print(f"   │   │   ├─ {pitch_name}.csv")
    print(f"   │   ├─ ...")
    print(f"   ├─ {BATTER_HEIGHT_MIN + 1}/")
    print(f"   └─ {BATTER_HEIGHT_MAX}/")
    
    print("\n📁 CSVフォーマット:")
    print("   time_s  : 時間 (秒)")
    print("   x_m     : 横方向 (正=一塁、負=三塁)")
    print("   y_m     : 奥行き (投手方向が正、捕手方向が負)")
    print("   z_m     : 高さ (正=上)")
    
    print("\n" + "=" * 70)
    print("✅ 完了")
    print("=" * 70)


if __name__ == "__main__":
    main()