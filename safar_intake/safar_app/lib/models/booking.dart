class Booking {
  final String id;
  final String listingId;
  final String userId;
  final DateTime checkIn;
  final DateTime checkOut;
  final int guests;
  final double totalPrice;
  final String status;
  final String? listingTitle;
  final String? listingImage;
  final String? paymentId;
  final DateTime? createdAt;

  Booking({
    required this.id,
    required this.listingId,
    required this.userId,
    required this.checkIn,
    required this.checkOut,
    required this.guests,
    required this.totalPrice,
    required this.status,
    this.listingTitle,
    this.listingImage,
    this.paymentId,
    this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? json['_id'] ?? '',
      listingId: json['listingId'] ?? '',
      userId: json['userId'] ?? '',
      checkIn: DateTime.parse(json['checkIn']),
      checkOut: DateTime.parse(json['checkOut']),
      guests: json['guests'] ?? 1,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      listingTitle: json['listingTitle'],
      listingImage: json['listingImage'],
      paymentId: json['paymentId'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'userId': userId,
      'checkIn': checkIn.toIso8601String(),
      'checkOut': checkOut.toIso8601String(),
      'guests': guests,
      'totalPrice': totalPrice,
      'status': status,
      'listingTitle': listingTitle,
      'listingImage': listingImage,
      'paymentId': paymentId,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  int get nights => checkOut.difference(checkIn).inDays;
}
