// Helper function to transform MongoDB document _id to id
export function transformBike(bike) {
  if (!bike) return null;
  return {
    id: bike._id?.toString() || bike.id,
    name: bike.name,
    type: bike.type,
    image: bike.image,
    pricePerHour: bike.pricePerHour,
    kmLimit: bike.kmLimit,
    available: bike.available,
    description: bike.description,
    features: bike.features
  };
}

export function transformUser(user) {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : user;
  return {
    id: userObj._id?.toString() || userObj.id,
    email: userObj.email,
    name: userObj.name,
    role: userObj.role,
    walletBalance: userObj.walletBalance,
    documents: userObj.documents || [],
    createdAt: userObj.createdAt
  };
}

export function transformRental(rental) {
  if (!rental) return null;
  const rentalObj = rental.toObject ? rental.toObject() : rental;
  return {
    id: rentalObj._id?.toString() || rentalObj.id,
    bikeId: rentalObj.bikeId?._id?.toString() || rentalObj.bikeId?.toString() || rentalObj.bikeId,
    userId: rentalObj.userId?._id?.toString() || rentalObj.userId?.toString() || rentalObj.userId,
    startTime: rentalObj.startTime,
    endTime: rentalObj.endTime,
    totalCost: rentalObj.totalCost,
    status: rentalObj.status,
    bike: rentalObj.bikeId && typeof rentalObj.bikeId === 'object' ? transformBike(rentalObj.bikeId) : null,
    user: rentalObj.userId && typeof rentalObj.userId === 'object' ? transformUser(rentalObj.userId) : null
  };
}

