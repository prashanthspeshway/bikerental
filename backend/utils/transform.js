// Helper function to transform MongoDB document _id to id
export function transformBike(bike) {
  if (!bike) return null;
  const bikeObj = bike.toObject ? bike.toObject() : bike;
  return {
    id: bikeObj._id?.toString() || bikeObj.id,
    name: bikeObj.name,
    type: bikeObj.type,
    brand: bikeObj.brand,
    image: bikeObj.image,
    pricePerHour: bikeObj.pricePerHour,
    kmLimit: bikeObj.kmLimit,
    available: bikeObj.available,
    description: bikeObj.description,
    features: bikeObj.features,
    locationId: bikeObj.locationId?._id?.toString() || bikeObj.locationId?.toString() || bikeObj.locationId,
    location: bikeObj.locationId && typeof bikeObj.locationId === 'object' ? {
      id: bikeObj.locationId._id?.toString(),
      name: bikeObj.locationId.name,
      city: bikeObj.locationId.city,
      state: bikeObj.locationId.state,
    } : null
  };
}

export function transformUser(user) {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : user;
  return {
    id: userObj._id?.toString() || userObj.id,
    email: userObj.email,
    name: userObj.name,
    mobile: userObj.mobile || '',
    emergencyContact: userObj.emergencyContact || '',
    familyContact: userObj.familyContact || '',
    permanentAddress: userObj.permanentAddress || '',
    currentAddress: userObj.currentAddress || '',
    hotelStay: userObj.hotelStay || '',
    role: userObj.role,
    walletBalance: userObj.walletBalance,
    isVerified: userObj.isVerified || false,
    documents: userObj.documents || [],
    createdAt: userObj.createdAt
  };
}

export function transformRental(rental) {
  if (!rental) return null;
  const rentalObj = rental.toObject ? rental.toObject() : rental;
  
  // Handle populated bikeId and userId
  let bikeId = rentalObj.bikeId;
  let userId = rentalObj.userId;
  let bike = null;
  let user = null;
  
  // Extract bikeId - could be ObjectId, populated object, or string
  if (bikeId && typeof bikeId === 'object' && bikeId._id) {
    // Populated bike object
    bike = transformBike(bikeId);
    bikeId = bikeId._id.toString();
  } else if (bikeId && typeof bikeId === 'object') {
    // Mongoose ObjectId
    bikeId = bikeId.toString();
  } else {
    bikeId = bikeId?.toString() || bikeId;
  }
  
  // Extract userId - could be ObjectId, populated object, or string
  if (userId && typeof userId === 'object' && userId._id) {
    // Populated user object
    user = transformUser(userId);
    userId = userId._id.toString();
  } else if (userId && typeof userId === 'object') {
    // Mongoose ObjectId
    userId = userId.toString();
  } else {
    userId = userId?.toString() || userId;
  }
  
  return {
    id: rentalObj._id?.toString() || rentalObj.id,
    bikeId: bikeId,
    userId: userId,
    startTime: rentalObj.startTime,
    endTime: rentalObj.endTime,
    totalCost: rentalObj.totalCost,
    status: rentalObj.status,
    bookingId: rentalObj.bookingId,
    pickupTime: rentalObj.pickupTime,
    dropoffTime: rentalObj.dropoffTime,
    totalAmount: rentalObj.totalAmount,
    paymentStatus: rentalObj.paymentStatus,
    paymentInfo: rentalObj.paymentInfo,
    bike: bike,
    user: user
  };
}
