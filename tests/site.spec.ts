import { test, expect } from "@playwright/test";

test.describe("Wood Fire Pizza Lenuo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has RTL Arabic document + title", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page).toHaveTitle(/لينو/);
  });

  test("hero headline + both CTAs visible", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: "احجز طاولة" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "استعرض القائمة" })).toBeVisible();
  });

  test("real Google rating cited", async ({ page }) => {
    await expect(page.getByText(/4\.4/).first()).toBeVisible();
    await expect(page.getByText(/3,959/).first()).toBeVisible();
  });

  test("preloader hides", async ({ page }) => {
    await page.waitForTimeout(1600);
    const pre = page.locator("#preloader");
    await expect(pre).toHaveCSS("display", "none");
  });

  test("all content images have alt + resolve (no 404)", async ({ page }) => {
    // scroll through so lazy-loaded images below the fold are fetched
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");

    // exclude the lightbox placeholder which has an empty src until activated
    const imgs = page.locator("img:not(#lbImg)");
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      await expect(img).toHaveAttribute("alt", /.+/);
      // poll until the image has decoded (lazy images may still be loading)
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 10000 })
        .toBeGreaterThan(0);
    }
  });

  test("contact = landline tel + maps, no WhatsApp", async ({ page }) => {
    await expect(page.locator('.fab-call[href="tel:0126140663"]')).toBeVisible();
    await expect(page.locator('.fab-maps[href*="google.com/maps"]')).toBeVisible();
    expect(await page.locator('a[href*="wa.me"]').count()).toBe(0);
    expect(await page.locator('a[href*="whatsapp"]').count()).toBe(0);
  });

  test("no invented prices — uses حسب القائمة", async ({ page }) => {
    await expect(page.getByText("حسب القائمة").first()).toBeVisible();
  });

  test("mobile menu is full-screen overlay", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#burgerBtn").click();
    const menu = page.locator("#mobileMenu");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(vp.height - 1);
    await page.locator("#menuClose").click();
    await expect(menu).toBeHidden();
  });

  test("reservation form validates + builds summary on success", async ({ page }) => {
    await page.locator("#submitBtn").click();
    await expect(page.locator(".field.invalid").first()).toBeVisible();

    await page.fill("#rName", "محمد العتيبي");
    await page.fill("#rPhone", "0512345678");
    await page.selectOption("#rGuests", "4");
    await page.fill("#rDate", "2026-07-01");
    await page.fill("#rTime", "20:30");
    await page.locator("#submitBtn").click();

    await expect(page.locator("#formSummary")).toBeVisible();
    await expect(page.locator("#toast")).toBeVisible();
  });

  test("no horizontal scroll at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test("JSON-LD Restaurant schema present", async ({ page }) => {
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ld).toContain('"@type": "Restaurant"');
    expect(ld).toContain('"ratingValue": "4.4"');
    expect(ld).toContain("Pizza");
  });
});
