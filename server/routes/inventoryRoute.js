const router = require("express").Router();
const Inventory = require("../models/inventoryModal");
const User = require("../models/userModel");
const authMiddleware = require("../middlewares/authMiddleware");
const mongoose = require("mongoose");
const { addMonths, format, differenceInMonths } = require("date-fns");
const nodemailer = require("nodemailer");
// add inventory
router.post("/add", authMiddleware, async (req, res) => {
  try {
    let formattedEligibleDateDonated;
    let formatedCurrentDate;
    let flag = 0;
    let donorName = null;
    let orgName = null;
    // valiadate email and inventoryType
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new Error("Invalid Email");

    if (req.body.inventoryType === "in" && user.userType !== "donor") {
      throw new Error("This email is not registered as a donor");
    }

    if (req.body.inventoryType === "out" && user.userType !== "hospital") {
      throw new Error("This email is not registered as a hospital");
    }

    if (req.body.inventoryType === "out") {
      // check if inventory is available
      const requstedGroup = req.body.bloodGroup;
      const requestedQuantity = req.body.quantity;
      const organization = new mongoose.Types.ObjectId(req.body.userId);

      //totalInOfRequestedGroup ---> array containing an object of _id: bloodgroup, total: IN quantity [{_id: 'a+', total:100}]
      const totalInOfRequestedGroup = await Inventory.aggregate([
        {
          $match: {
            organization,
            inventoryType: "in",
            bloodGroup: requstedGroup,
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            total: { $sum: "$quantity" },
          },
        },
      ]);

      const totalIn = totalInOfRequestedGroup[0]?.total || 0; //object.total

      //totalOutOfRequestedGroup ---> array containing an object of _id: bloodgroup, total: OUT quantity [{_id: 'a+', total:100}]
      const totalOutOfRequestedGroup = await Inventory.aggregate([
        {
          $match: {
            organization,
            inventoryType: "out",
            bloodGroup: requstedGroup,
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            total: { $sum: "$quantity" },
          },
        },
      ]);

      const totalOut = totalOutOfRequestedGroup[0]?.total || 0; //object.total

      const availableQuantityOfRequestedGroup = totalIn - totalOut;

      if (availableQuantityOfRequestedGroup < requestedQuantity) {
        throw new Error(
          `Only ${availableQuantityOfRequestedGroup} units of ${requstedGroup.toUpperCase()} is available`
        );
      }
      req.body.hospital = user._id;
    } else {
      // Handling "in" inventory type (donor adding inventory)
      // Check donor eligibility
      flag = 1;
      const orgId = new mongoose.Types.ObjectId(req.body.userId);
      const organization = await User.findOne({ _id: orgId });
      orgName = organization.organizationName;
      const lastDonation = await Inventory.findOne({
        donor: user._id,
        inventoryType: "in",
      })
        .sort({ createdAt: -1 }) // Sort by createdAt descending to get the latest donation
        .exec();
      const currentDate = new Date();
      const eligibleDateWhendonated = addMonths(currentDate, 3);
      formattedEligibleDateDonated = format(
        eligibleDateWhendonated,
        "dd/MM/yyyy"
      );
      formatedCurrentDate = format(currentDate, "dd/MM/yyyy");

      if (lastDonation) {
        const lastDonationDate = new Date(lastDonation.createdAt);
        //const currentDate = new Date();

        // Calculate difference in months
        const diffInMonths = differenceInMonths(currentDate, lastDonationDate);
        // Check if last donation was less than 3 months ago
        if (diffInMonths < 3) {
          // Calculate the eligible date
          const eligibleDate = addMonths(lastDonationDate, 3);
          const formattedEligibleDate = format(eligibleDate, "dd/MM/yyyy");
          throw new Error(
            `Donor is not eligible for donation. Last donation was on ${format(
              lastDonationDate,
              "dd/MM/yyyy"
            )}. Next eligible donation date will be after ${formattedEligibleDate}.`
          );
        }
      }

      // Assign donor ID to the request body

      req.body.donor = user._id;
    }

    // add inventory
    const inventory = new Inventory(req.body);
    await inventory.save();

    if (flag) {
      donorName = user.name;
      // Create Nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, //true for 465, false for other ports
        auth: {
          user: process.env.email_account,
          pass: process.env.email_pass,
        },
      });

      const mailOptions = {
        from: `"BloodLink" <${process.env.email_account}>`,
        to: req.body.email,
        subject: `Blood Donation at ${orgName} on ${formatedCurrentDate}`,
        text: `Dear ${donorName},\n\nYou have recently donated blood at ${orgName} on ${formatedCurrentDate}. We really appreciate your participation for this noble cause.\n\nYour next eligible donation date is on ${formattedEligibleDateDonated} \n\nBest regards,\n${orgName}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }
    return res.send({ success: true, message: "Inventory Added Successfully" });
  } catch (error) {
    return res.send({ success: false, message: error.message });
  }
});

// get inventory
router.get("/get", authMiddleware, async (req, res) => {
  try {
    const inventory = await Inventory.find({ organization: req.body.userId })
      .sort({ createdAt: -1 })
      .populate("donor")
      .populate("hospital");
    return res.send({ success: true, data: inventory });
  } catch (error) {
    return res.send({ success: false, message: error.message });
  }
});

// get inventory
router.post("/filter", authMiddleware, async (req, res) => {
  try {
    const inventory = await Inventory.find(req.body.filters)
      .limit(req.body.limit || 10)
      .sort({ createdAt: -1 })
      .populate("donor")
      .populate("hospital")
      .populate("organization");
    return res.send({ success: true, data: inventory });
  } catch (error) {
    return res.send({ success: false, message: error.message });
  }
});

// Get donor's last donation date and next eligible donation date
router.get("/donor-info/:donorId", async (req, res) => {
  const { donorId } = req.params;

  try {
    // Validate donorId
    const donor = await User.findById(donorId);
    if (!donor || donor.userType !== "donor") {
      throw new Error("Invalid donor ID or the user is not a donor");
    }

    // Find the last donation
    const lastDonation = await Inventory.findOne({
      donor: donorId,
      inventoryType: "in",
    }).sort({ createdAt: -1 });
    let lastDonationDate = null;
    let nextEligibleDate = "Eligible for donation";

    if (lastDonation) {
      lastDonationDate = new Date(lastDonation.createdAt);
      const nextEligibleDateObj = addMonths(lastDonationDate, 3);
      if (differenceInMonths(new Date(), lastDonationDate) < 3) {
        nextEligibleDate = format(nextEligibleDateObj, "dd MMMM yyyy");
      } else {
        nextEligibleDate = "Eligible for donation";
      }
    }
    return res.send({
      success: true,
      data: {
        lastDonationDate: lastDonationDate
          ? format(lastDonationDate, "dd MMMM yyyy")
          : null,
        nextEligibleDate,
      },
    });
  } catch (error) {
    return res.send({ success: false, message: error.message });
  }
});

router.post("/sent-message", authMiddleware, async (req, res) => {
  try {
    const { message, organization } = req.body;
    //fetch organization Name
    const org = await User.findById(organization);
    const orgName = org.organizationName;
    // Fetch distinct donors for the organization
    const donors = await Inventory.find({
      organization,
      inventoryType: "in",
    }).distinct("donor");
    if (donors.length === 0) {
      throw new Error("No donors found for this organization.");
    }

    // Fetch donor emails
    const donorEmails = await User.find({ _id: { $in: donors } }, "email name");

    if (donorEmails.length === 0) {
      throw new Error("No donor emails found.");
    }

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, //true for 465, false for other ports
      auth: {
        user: process.env.email_account,
        pass: process.env.email_pass,
      },
    });

    // Send email to each donor
    donorEmails.forEach((donor) => {
      const mailOptions = {
        from: `"BloodLink" <${process.env.email_account}>`,
        to: donor.email,
        subject: "Blood Donation Campaign Announcement",
        text: `Dear ${donor.name},\n\n${message}\n\nBest regards,\n${orgName}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    });

    return res.send({
      success: true,
      message: "Announcement sent successfully.",
    });
  } catch (error) {
    return res.send({ success: false, message: error.message });
  }
});

router.post("/search", authMiddleware, async (req, res) => {
  console.log("Values received in backend:", req.body);

  const { bloodGroup, quantity } = req.body;

  try {
    // Step 1: Match the Blood Group
    const matchedBloodGroup = await Inventory.aggregate([
      { $match: { bloodGroup } },
    ]);

    console.log("Step 1 - Matched Blood Group:", matchedBloodGroup);

    // Step 2: Group by Organization and Blood Group
    const groupedByOrgAndBloodGroup = await Inventory.aggregate([
      { $match: { bloodGroup } },
      {
        $group: {
          _id: { organization: "$organization", bloodGroup: "$bloodGroup" },
          totalIn: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "in"] }, "$quantity", 0],
            },
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ["$inventoryType", "out"] }, "$quantity", 0],
            },
          },
        },
      },
    ]);

    console.log(
      "Step 2 - Grouped by Organization and Blood Group:",
      groupedByOrgAndBloodGroup
    );

    // Step 3: Project the Available Quantity
    const projectedAvailableQuantity = groupedByOrgAndBloodGroup.map(
      (group) => ({
        organization: group._id.organization,
        bloodGroup: group._id.bloodGroup,
        availableQuantity: group.totalIn - group.totalOut,
      })
    );

    console.log(
      "Step 3 - Projected Available Quantity:",
      projectedAvailableQuantity
    );

    // Step 4: Filter Organizations with Sufficient Quantity
    const filteredOrganizations = projectedAvailableQuantity.filter(
      (group) => group.availableQuantity >= quantity
    );

    console.log("Step 4 - Filtered Organizations:", filteredOrganizations);

    // Step 5: Lookup Organization Details
    const organizationIds = filteredOrganizations.map(
      (group) => group.organization
    );
    const organizations = await User.find({ _id: { $in: organizationIds } });

    console.log("Step 5 - Lookup Organization Details:", organizations);

    // Step 6: Format the Final Output
    const formattedOutput = filteredOrganizations.map((group) => {
      const orgDetails = organizations.find((org) =>
        org._id.equals(group.organization)
      );
      return {
        organizationName: orgDetails.organizationName,
        email: orgDetails.email,
        phone: orgDetails.phone,
        address: orgDetails.address,
        availableQuantity: group.availableQuantity,
      };
    });

    res.status(200).send({
      success: true,
      data: formattedOutput,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
