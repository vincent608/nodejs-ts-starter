// test/calculator.test.ts
import { add } from "../src/model/calculator";

describe("add", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
