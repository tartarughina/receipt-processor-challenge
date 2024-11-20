const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const memory = {}; // In-memory storage

const test_field = (body, field, regex) => {
  if ((!field) in body) {
    return false;
  } else {
    if (typeof body[field] != "string") return false;
    else if (!regex.test(body[field])) return false;
  }

  return true;
};

const verify_body = (body) => {
  if (
    test_field(body, "retailer", /^[\w\s\-&]+$/) &&
    test_field(body, "purchaseDate", /^\d{4}-\d{2}-\d{2}$/) &&
    test_field(body, "purchaseTime", /^\d{2}:\d{2}$/) &&
    test_field(body, "total", /^\d+\.\d{2}$/)
  ) {
  } else return false;

  if ((!"items") in body) {
    return false;
  } else {
    if (typeof body.items != "object") return false;
  }

  return true;
};

const verify_list_items = (items) => {
  for (const item of items) {
    if (
      !test_field(item, "shortDescription", /^[\w\s\-]+$/) ||
      !test_field(item, "price", /^\d+\.\d{2}$/)
    )
      return false;
  }

  return true;
};

const get_points_from_receipt = (receipt) => {
  // * One point for every alphanumeric character in the retailer name.
  // * 50 points if the total is a round dollar amount with no cents.
  // * 25 points if the total is a multiple of `0.25`.
  // * 5 points for every two items on the receipt.
  // * If the trimmed length of the item description is a multiple of 3, multiply the price by `0.2` and round up to the nearest integer. The result is the number of points earned.
  // * 6 points if the day in the purchase date is odd.
  // * 10 points if the time of purchase is after 2:00pm and before 4:00pm.
  let points = 0;

  points += receipt.retailer.length;

  const total = parseFloat(receipt.total);
  points += total % 1 == 0 ? 50 : 0;
  points += total % 0.25 == 0 ? 25 : 0;

  points += Math.floor(receipt.items.length / 2) * 5;

  receipt.items.forEach((item) => {
    points +=
      item.shortDescription.trim().length % 3 == 0
        ? Math.ceil(parseFloat(item.price) * 0.2)
        : 0;
  });

  points += parseInt(receipt.purchaseDate.split("-")[2]) % 2 == 1 ? 6 : 0;
  points +=
    receipt.purchaseTime > "14:00" && receipt.purchaseTime < "16:00" ? 10 : 0;

  return points;
};

app.post("/receipts/process", (req, res) => {
  if (
    req.is("application/json") &&
    verify_body(req.body) &&
    verify_list_items(req.body.items)
  ) {
    const rec_id = uuidv4();

    memory[rec_id] = get_points_from_receipt(req.body);

    res.status(200).json({ id: rec_id }).end();
  } else res.status(400).json({ description: "Receipt is invalid" }).end();
});

app.get("/receipts/:id/points", (req, res) => {
  const id = req.params.id;

  if (id in memory) {
    res.status(200).json({ points: memory[id] }).end();
  } else
    res.status(404).json({ description: "No receipt found for that id" }).end();
});

app.listen(port, () => {
  console.log(`Receipt processor listening on port ${port}`);
});
