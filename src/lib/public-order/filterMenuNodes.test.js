import { describe, expect, it } from "vitest";
import { filterMenuNodes } from "./filterMenuNodes.js";

describe("filterMenuNodes", () => {
  it("keeps matching ancestors and removes unrelated branches", () => {
    const tree = [
      {
        name: "Main dishes",
        children: [
          {
            name: "Rice",
            children: [],
            items: [
              {
                id: 1,
                name: "Pilau",
                description: "Spiced rice",
                categoryPath: "Main dishes > Rice",
              },
            ],
          },
          {
            name: "Stews",
            children: [],
            items: [
              {
                id: 2,
                name: "Beef stew",
                description: "Slow cooked",
                categoryPath: "Main dishes > Stews",
              },
            ],
          },
        ],
        items: [],
      },
    ];

    const filtered = filterMenuNodes(tree, "pilau");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children[0].name).toBe("Rice");
    expect(filtered[0].children[0].items).toEqual([
      expect.objectContaining({ id: 1, name: "Pilau" }),
    ]);
  });
});
