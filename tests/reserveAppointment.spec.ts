import { test, expect } from "@playwright/test";
import {
  fillPaymentDetails,
  fillContactDetails,
  getDateComponents,
  convertTo12HourFormat,
  getRandomState,
  checkFooterLinks,
  selectRandomDateContainer,
  selectRandomTimeSlot,
  verifyAppointmentDetails,
  waitForGraphQLResponse,
} from "./utils.js";

test("Reserve an appointment", async ({ page }) => {
  await test.step("Visit and select state", async () => {
    await page.goto("https://onboard-dev.henrymeds.com/");

    // Check title and main elements
    await expect(page).toHaveTitle("Phentermine Appointment - Henry Meds");
    await expect(page.getByRole("img", { name: "Henry Logo" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Schedule your Appointment!" })
    ).toBeVisible();

    // Check visibility of state buttons
    const states = [
      "California",
      "Colorado",
      "Florida",
      "Georgia",
      "Illinois",
      "Maryland",
      "Massachusetts",
      "New Hampshire",
      "Texas",
      "Utah",
      "Virginia",
      "Washington",
      "Other State",
    ];

    await Promise.all(
      states.map(async (state) => {
        await expect(page.getByRole("button", { name: state })).toBeVisible();
      })
    );

    // Use the utility function to choose a random state excluding 'Other State'
    const randomState = getRandomState(states, "Other State");
    console.log(`Randomly selected state: ${randomState}`);
    await page.getByRole("button", { name: randomState }).click();
  });

  await test.step("Choose random available time and verify appointment details", async () => {
    const response = await waitForGraphQLResponse(page, "cappedAvailableTimes");
    expect(response.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Next Available Time" })
    ).toBeVisible();

    const dateContainer = await selectRandomDateContainer(page);
    const currentYear = new Date().getFullYear();
    const timeSlot = await selectRandomTimeSlot(dateContainer, currentYear);

    await timeSlot.click();

    await verifyAppointmentDetails(page, dateContainer, timeSlot);
  });

  await test.step("Fill in contact details", async () => {
    await fillContactDetails(page);
  });

  await test.step("Fill in payment details", async () => {
    await fillPaymentDetails(page);
  });
});
