import { expect, page } from "@playwright/test";
const { faker } = require("@faker-js/faker");

function getDateComponents(dateString) {
  return dateString
    .replace(/,/g, "") // Remove commas
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1") // Remove ordinal suffixes
    .split(/\s+/); // Split by whitespace to get individual components
}

function convertTo12HourFormat(time) {
  let [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = ((hours + 11) % 12) + 1; // Convert 0-23 hour format to 1-12 format
  return `${hours}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}
function getRandomState(states, excludeState) {
  const filteredStates = states.filter((state) => state !== excludeState);
  const randomIndex = Math.floor(Math.random() * filteredStates.length);
  return filteredStates[randomIndex];
}

async function checkFooterLinks(page) {
  await expect(page.getByRole("heading", { name: "Questions?" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "(909) 787-2342" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ask@HenryMeds.com" })
  ).toHaveAttribute("href", "mailto:Ask@HenryMeds.com");
  await expect(
    page.getByRole("link", { name: "terms and conditions." })
  ).toHaveAttribute("href", "https://henrymeds.com/terms-and-conditions/");
}

async function selectRandomDateContainer(page) {
  const currentYear = new Date().getFullYear();
  const dateContainers = await page.$$(".MuiBox-root.css-0");
  const randomIndexContainer = Math.floor(
    Math.random() * dateContainers.length
  );
  return dateContainers[randomIndexContainer];
}

async function selectRandomTimeSlot(dateContainer, currentYear) {
  const timeSlots = await dateContainer.$$(`[data-testid^="${currentYear}-"]`);

  const randomIndexSlot = Math.floor(Math.random() * timeSlots.length);
  return timeSlots[randomIndexSlot];
}

async function verifyAppointmentDetails(page, dateContainer, timeSlot) {
  await expect(page.getByRole("heading", { name: "Next Steps" })).toBeVisible();
  const displayedDate = await dateContainer.textContent();
  const dayAndDate = displayedDate.split(" (")[0];
  const slotTime = await timeSlot.getAttribute("data-testid");
  const slotHour = slotTime.split("T")[1].substring(0, 5); 
  const slotHour12 = convertTo12HourFormat(slotHour); 
  const providerText = await page
    .getByTestId("pending-appointment-provider")
    .textContent();
  expect(providerText).not.toBe("");

  // Click the 'continue' button to proceed
  await page.getByTestId("continue").click();
}

async function fillContactDetails(page) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email();
  const phoneNumber = faker.phone.number();
  const address = faker.location.streetAddress();
  const city = faker.location.city();
  const state = faker.location.state({ abbreviated: true });
  const zip = faker.location.zipCode();

  await page.getByTestId("firstName").fill(firstName);
  await page.getByTestId("lastName").fill(lastName);
  await page.getByTestId("email").fill(email);
  await page.getByTestId("dob").fill("09/09/1990");
  await page.getByTestId("phoneNumber").fill(phoneNumber);
  await page.getByTestId("sex").selectOption("F");
  await page.getByTestId("preferredPronouns").selectOption("other");
  await page.getByTestId("continue").click();

  await page.getByTestId("addressLine1").fill(address);
  await page.getByTestId("addressLine2").fill("#1234");
  await page.getByTestId("city").fill(city);
  await page.getByTestId("zip").fill(zip);
  await page
    .getByLabel("My Billing and Shipping addresses are the same")
    .uncheck();
  await page.getByTestId("continue").click();

  // If the billing address is different
  await page.getByTestId("addressLine1").fill(faker.location.streetAddress());
  await page.getByTestId("addressLine2").fill("#12345");
  await page.getByTestId("city").fill(faker.location.city());
  await page.getByTestId("state").fill(state);
  await page.getByTestId("zip").fill(faker.location.zipCode());
  await page.getByTestId("continue").click();
}

async function fillPaymentDetails(page) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const cardExpiry = `${faker.date.future().getMonth() + 1}/${faker.date
    .future()
    .getFullYear()
    .toString()
    .slice(-2)}`;
  const cardCVV = faker.finance.creditCardCVV();

  await expect(
    page.getByRole("heading", { name: "Payment Method" })
  ).toBeVisible();
  await page.getByTestId("firstName").fill(firstName);
  await page.getByTestId("lastName").fill(lastName);

  const cardExpiryFrame = page.frameLocator(
    'iframe[name="cb-component-expiry-1"]'
  );
  const cardCVVFrame = page.frameLocator('iframe[name="cb-component-cvv-2"]');

  await cardExpiryFrame.getByPlaceholder("MM / YY").fill(cardExpiry);
  await cardCVVFrame.getByPlaceholder("CVV").fill(cardCVV);

  await page.getByLabel("Coupon Code").fill("Free");

  await page.getByTestId("startTreatment").click();
}

async function waitForGraphQLResponse(page, operationName) {
  return page.waitForResponse(async (response) => {
    const url = response.url();
    const status = response.status();
    if (url.includes("/v1/graphql") && status === 200) {
      const responseBody = await response.json();
      // Check if the operationName is in the response, this assumes the operationName is returned in the response body
      return (
        responseBody.data && responseBody.data.hasOwnProperty(operationName)
      );
    }
    return false;
  });
}
export {
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
};
