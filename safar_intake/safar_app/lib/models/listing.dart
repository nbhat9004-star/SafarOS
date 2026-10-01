class Listing {
  final String id;
  final String title;
  final String description;
  final String category;
  final String? subcategory;
  final String location;
  final double price;
  final List<String> images;
  final String hostId;
  final String hostName;
  final String? hostAvatar;
  final List<String>? amenities;
  final double? rating;
  final int? reviewCount;
  final String status;

  Listing({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.subcategory,
    required this.location,
    required this.price,
    required this.images,
    required this.hostId,
    required this.hostName,
    this.hostAvatar,
    this.amenities,
    this.rating,
    this.reviewCount,
    required this.status,
  });

  factory Listing.fromJson(Map<String, dynamic> json) {
    return Listing(
      id: json['id'] ?? json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'stay',
      subcategory: json['subcategory'],
      location: json['location'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      images: (json['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
      hostId: json['hostId'] ?? '',
      hostName: json['hostName'] ?? 'Host',
      hostAvatar: json['hostAvatar'],
      amenities: (json['amenities'] as List?)?.map((e) => e.toString()).toList(),
      rating: json['rating']?.toDouble(),
      reviewCount: json['reviewCount'],
      status: json['status'] ?? 'approved',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'subcategory': subcategory,
      'location': location,
      'price': price,
      'images': images,
      'hostId': hostId,
      'hostName': hostName,
      'hostAvatar': hostAvatar,
      'amenities': amenities,
      'rating': rating,
      'reviewCount': reviewCount,
      'status': status,
    };
  }
}
