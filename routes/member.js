const Router = require("express");
const {
  addMember,
  updateMember,
  deleteMember,
  updateImage,
  getMembers,
  addMemberImage,
} = require("../controller/member");
const {
  isAuthenticated,
  isInClub,
  isOperator,
  isUser,
} = require("../middleware/auth");
const { validateAddMember } = require("../middleware/zod-user-middleware");
const router = Router();

router.post(
  "/add-member",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  validateAddMember,
  addMember
);
router.get(
  "/get-member/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  getMembers
);

router.put(
  "/update-member/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateMember
);
router.put(
  "/update-member-image/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateImage
);
router.delete(
  "/delete-member/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  deleteMember
);
router.get(
  "/get-all-members",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  getMembers
);
router.post(
  "/add-member-image/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  addMemberImage
);

module.exports = router;
