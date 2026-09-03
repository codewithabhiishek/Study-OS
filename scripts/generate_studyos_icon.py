#!/usr/bin/env python3
"""
Production macOS Native Squircle Icon Generator for StudyOS:
1. Authentic continuous-curvature Apple squircle mask (~22.5% corner radius, 60% corner smoothing).
2. Proper breathing room & edge padding (~90px margins around cybernetic chassis).
3. Sleek dark brushed titanium/slate plate with radial neon green (#00FF87) glow & Apple chamfered rim.
4. Native macOS floating drop shadows (ambient + contact) on transparent 1024x1024 canvas.
5. Full 10-layer .iconset generation (16-1024px @1x/@2x) & compilation to .icns via iconutil.
6. Updates all assets in src-tauri/icons, public/, /Applications/StudyOS.app, and rebuilds the DMG.
"""

import os
import shutil
import subprocess
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops

PROJECT_ROOT = Path("/Users/abhiishek/Developer/Vibe-Coding/Projects/Study-OS")
ICONS_DIR = PROJECT_ROOT / "src-tauri" / "icons"
ORIG_ICON_BACKUP = PROJECT_ROOT / "scripts" / "orig_icon_backup.png"
TEMP_DIR = PROJECT_ROOT / "scripts" / ".icon_build_temp"

# Target icon files
ICON_PNG = ICONS_DIR / "icon.png"
ICON_ICNS = ICONS_DIR / "icon.icns"
DMG_ICNS = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle" / "dmg" / "icon.icns"
DMG_FILE = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle" / "dmg" / "StudyOS_1.0.1_aarch64.dmg"
APP_BUNDLE_ICNS = Path("/Applications/StudyOS.app/Contents/Resources/icon.icns")
PUBLIC_FAVICON_PNG = PROJECT_ROOT / "public" / "favicon.png"
PUBLIC_FAVICON_ICO = PROJECT_ROOT / "public" / "favicon.ico"


def setup_backup():
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    if not ORIG_ICON_BACKUP.exists() and ICON_PNG.exists():
        shutil.copy(ICON_PNG, ORIG_ICON_BACKUP)
        print(f"✓ Original icon backed up to {ORIG_ICON_BACKUP}")


def generate_squircle_mask() -> Image.Image:
    """Generate Apple continuous-curvature squircle mask via figma-squircle + headless Chrome."""
    mask_html = TEMP_DIR / "squircle_mask.html"
    mask_png = TEMP_DIR / "squircle_mask.png"

    figma_path = "/Users/abhiishek/Developer/Vibe-Coding/Mac-Agent/dashboard/node_modules/figma-squircle"
    node_cmd = [
        "node",
        "-e",
        f"""
        const fs = require('fs');
        const {{ getSvgPath }} = require('{figma_path}');
        const squirclePath = getSvgPath({{
            width: 824,
            height: 824,
            cornerRadius: 185,
            cornerSmoothing: 0.6,
        }});
        const html = `<!DOCTYPE html>
        <html>
        <head>
        <style>
          * {{ margin: 0; padding: 0; }}
          body {{ background: transparent; width: 1024px; height: 1024px; overflow: hidden; }}
        </style>
        </head>
        <body>
          <svg width="1024" height="1024" viewBox="0 0 1024 1024">
            <g transform="translate(100, 100)">
              <path d="${{squirclePath}}" fill="white" />
            </g>
          </svg>
        </body>
        </html>`;
        fs.writeFileSync('{mask_html}', html);
        """,
    ]
    subprocess.run(node_cmd, check=True)

    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    render_cmd = [
        chrome_bin,
        "--headless",
        f"--screenshot={mask_png}",
        "--window-size=1024,1024",
        "--default-background-color=00000000",
        f"file://{mask_html}",
    ]
    subprocess.run(render_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    mask_img = Image.open(mask_png).convert("RGBA")
    return mask_img.getchannel("A")


def extract_glyph(orig_path: Path) -> Image.Image:
    """Extract neon green terminal prompt and cybernetic chassis without hard black background."""
    orig = Image.open(orig_path).convert("RGBA")
    w, h = orig.size
    glyph = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gp = glyph.load()
    pixels = orig.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            brightness = max(r, g, b)

            # Preserve green luminescence and circuit lines
            if g > 15 and g >= r and g >= b:
                # Alpha boosted for rich luminescence
                alpha = min(255, int(brightness * 1.55))
                # Slight neon saturation boost
                nr = min(255, int(r * 0.9))
                ng = min(255, int(g * 1.15))
                nb = min(255, int(b * 0.9))
                gp[x, y] = (nr, ng, nb, alpha)

    return glyph


def build_master_icon() -> Image.Image:
    print("🎨 Generating Apple continuous-curvature squircle mask...")
    squircle_mask = generate_squircle_mask()

    canvas_size = 1024
    final_canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

    # 1. Native macOS Dual Floating Drop Shadows
    print("✨ Creating native macOS ambient & contact drop shadows...")
    amb_mask = Image.new("L", (canvas_size, canvas_size), 0)
    amb_mask.paste(squircle_mask, (0, 14))
    amb_mask = amb_mask.filter(ImageFilter.GaussianBlur(26))
    amb_alpha = amb_mask.point(lambda p: int(p * 0.32))

    contact_mask = Image.new("L", (canvas_size, canvas_size), 0)
    contact_mask.paste(squircle_mask, (0, 6))
    contact_mask = contact_mask.filter(ImageFilter.GaussianBlur(10))
    contact_alpha = contact_mask.point(lambda p: int(p * 0.24))

    shadow_alpha = ImageChops.add(amb_alpha, contact_alpha)
    shadow_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 255))
    final_canvas.paste(shadow_layer, (0, 0), shadow_alpha)

    # 2. Dark Brushed Titanium Plate
    print("🛸 Generating dark brushed slate plate with metallic streaks...")
    plate = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 255))
    draw_plate = ImageDraw.Draw(plate)

    # Base gradient: #151b22 (top) to #090d12 (bottom)
    for y in range(100, 924):
        ratio = (y - 100) / 824.0
        r = int(21 * (1.0 - ratio * 0.55))
        g = int(28 * (1.0 - ratio * 0.55))
        b = int(35 * (1.0 - ratio * 0.50))
        draw_plate.line([(100, y), (924, y)], fill=(r, g, b, 255))

    # Brushed streaks
    import random
    random.seed(42)
    streaks = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw_streaks = ImageDraw.Draw(streaks)
    for _ in range(35000):
        sx = random.randint(100, 900)
        sy = random.randint(100, 924)
        slen = random.randint(15, 50)
        shade = random.randint(35, 68)
        draw_streaks.line([(sx, sy), (min(924, sx + slen), sy)], fill=(shade, shade + 8, shade + 12, 12))
    plate = Image.alpha_composite(plate, streaks)

    # 3. Ambient Radial Neon Green Glow behind Glyph
    print("⚡ Adding ambient neon green (#00FF87) radial backlight...")
    center_glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw_cg = ImageDraw.Draw(center_glow)
    gcx, gcy = 512, 508
    for r in range(340, 0, -12):
        alpha = int(((1.0 - r / 340.0) ** 1.8) * 55)
        draw_cg.ellipse([gcx - r, gcy - r, gcx + r, gcy + r], fill=(0, 255, 135, alpha))
    center_glow = center_glow.filter(ImageFilter.GaussianBlur(18))
    plate = Image.alpha_composite(plate, center_glow)

    # 4. Extract and Center StudyOS Terminal Glyph with Breathing Room
    print("🎯 Centering StudyOS terminal prompt & chassis inside squircle plate...")
    source_path = ORIG_ICON_BACKUP if ORIG_ICON_BACKUP.exists() else ICON_PNG
    glyph = extract_glyph(source_path)

    # Scale to 650x650 inside 824x824 plate -> ~87px elegant margins
    target_size = 650
    glyph_scaled = glyph.resize((target_size, target_size), Image.Resampling.LANCZOS)
    gx = (canvas_size - target_size) // 2
    gy = 508 - target_size // 2

    plate.paste(glyph_scaled, (gx, gy), glyph_scaled)

    # 5. Apple Chamfered Rim Highlight
    print("💎 Adding Apple chamfered rim highlight...")
    rim = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw_rim = ImageDraw.Draw(rim)
    draw_rim.line([(320, 101), (704, 101)], fill=(255, 255, 255, 75), width=2)
    rim = rim.filter(ImageFilter.GaussianBlur(0.8))
    plate = Image.alpha_composite(plate, rim)

    # 6. Mask Plate with Apple Squircle and Composite
    masked_tile = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    masked_tile.paste(plate, (0, 0), squircle_mask)
    final_canvas.paste(masked_tile, (0, 0), squircle_mask)

    return final_canvas


def compile_iconset_and_icns(master_icon: Image.Image):
    print("📦 Generating full macOS .iconset (16–1024px @1x/@2x)...")
    iconset_dir = TEMP_DIR / "StudyOS.iconset"
    if iconset_dir.exists():
        shutil.rmtree(iconset_dir)
    iconset_dir.mkdir(parents=True, exist_ok=True)

    icon_specs = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]

    for fname, size in icon_specs:
        resized = master_icon.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(iconset_dir / fname, "PNG")

    # Compile .icns using macOS iconutil
    temp_icns = TEMP_DIR / "icon.icns"
    if temp_icns.exists():
        temp_icns.unlink()

    print("🔨 Compiling to native macOS icon.icns via iconutil...")
    subprocess.run(["iconutil", "-c", "icns", str(iconset_dir), "-o", str(temp_icns)], check=True)

    # Copy to destinations
    shutil.copy(temp_icns, ICON_ICNS)
    print(f"✓ Saved: {ICON_ICNS}")

    if DMG_ICNS.parent.exists():
        shutil.copy(temp_icns, DMG_ICNS)
        print(f"✓ Saved: {DMG_ICNS}")

    if APP_BUNDLE_ICNS.parent.exists():
        shutil.copy(temp_icns, APP_BUNDLE_ICNS)
        print(f"✓ Saved: {APP_BUNDLE_ICNS}")


def update_auxiliary_icons(master_icon: Image.Image):
    print("🖼️ Updating auxiliary icons in src-tauri/icons and public/...")
    # Master icon.png (1024x1024)
    master_icon.save(ICON_PNG, "PNG")
    print(f"✓ Saved: {ICON_PNG}")

    # 32x32.png
    master_icon.resize((32, 32), Image.Resampling.LANCZOS).save(ICONS_DIR / "32x32.png", "PNG")
    # 128x128.png
    master_icon.resize((128, 128), Image.Resampling.LANCZOS).save(ICONS_DIR / "128x128.png", "PNG")
    # 128x128@2x.png
    master_icon.resize((256, 256), Image.Resampling.LANCZOS).save(ICONS_DIR / "128x128@2x.png", "PNG")

    # Windows icon.ico
    master_icon.resize((256, 256), Image.Resampling.LANCZOS).save(
        ICONS_DIR / "icon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print(f"✓ Saved: {ICONS_DIR / 'icon.ico'}")

    # Web favicons
    if PUBLIC_FAVICON_PNG.parent.exists():
        master_icon.resize((128, 128), Image.Resampling.LANCZOS).save(PUBLIC_FAVICON_PNG, "PNG")
        master_icon.resize((64, 64), Image.Resampling.LANCZOS).save(PUBLIC_FAVICON_ICO, format="ICO", sizes=[(16, 16), (32, 32), (64, 64)])
        print(f"✓ Favicons updated: {PUBLIC_FAVICON_PNG}")


def update_dmg():
    """Update .VolumeIcon.icns and StudyOS.app inside StudyOS_1.0.1_aarch64.dmg."""
    if not DMG_FILE.exists():
        print(f"⚠️ DMG file not found at {DMG_FILE}, skipping DMG update.")
        return

    print("💿 Updating StudyOS DMG with new squircle icon...")
    rw_dmg = TEMP_DIR / "StudyOS_rw.dmg"
    if rw_dmg.exists():
        rw_dmg.unlink()

    mount_point = TEMP_DIR / "dmg_mount"
    mount_point.mkdir(parents=True, exist_ok=True)

    # 1. Convert to read-write format
    subprocess.run(["hdiutil", "convert", str(DMG_FILE), "-format", "UDRW", "-o", str(rw_dmg)], check=True)

    # 2. Attach read-write
    attach_cmd = ["hdiutil", "attach", str(rw_dmg), "-mountpoint", str(mount_point), "-nobrowse"]
    subprocess.run(attach_cmd, check=True)

    try:
        # Update .VolumeIcon.icns
        target_vol_icon = mount_point / ".VolumeIcon.icns"
        shutil.copy(ICON_ICNS, target_vol_icon)

        # Update StudyOS.app icon inside DMG
        app_in_dmg_icon = mount_point / "StudyOS.app" / "Contents" / "Resources" / "icon.icns"
        if app_in_dmg_icon.exists():
            shutil.copy(ICON_ICNS, app_in_dmg_icon)
            print("✓ Updated StudyOS.app/Contents/Resources/icon.icns inside DMG")

        # Set custom volume icon attribute
        subprocess.run(["SetFile", "-a", "C", str(mount_point)], check=False)
        print("✓ Applied custom volume icon attribute (SetFile -a C)")
    finally:
        # 3. Detach cleanly
        time.sleep(1)
        subprocess.run(["hdiutil", "detach", str(mount_point)], check=True)

    # 4. Convert back to UDZO compressed DMG
    backup_dmg = DMG_FILE.with_suffix(".dmg.bak")
    shutil.move(DMG_FILE, backup_dmg)

    subprocess.run(
        ["hdiutil", "convert", str(rw_dmg), "-format", "UDZO", "-imagekey", "zlib-level=9", "-o", str(DMG_FILE)],
        check=True,
    )
    if backup_dmg.exists():
        backup_dmg.unlink()
    if rw_dmg.exists():
        rw_dmg.unlink()

    print(f"🎉 Successfully updated DMG with squircle icon: {DMG_FILE}")


def refresh_macos_caches():
    print("🔄 Refreshing macOS icon caches and Dock/Finder...")
    subprocess.run(["touch", "/Applications/StudyOS.app"], check=False)
    subprocess.run(["killall", "Dock", "Finder"], check=False)
    print("✓ Dock and Finder refreshed.")


def main():
    setup_backup()
    master_icon = build_master_icon()
    compile_iconset_and_icns(master_icon)
    update_auxiliary_icons(master_icon)
    update_dmg()
    refresh_macos_caches()
    print("✨ StudyOS macOS squircle icon upgrade complete!")


if __name__ == "__main__":
    main()
