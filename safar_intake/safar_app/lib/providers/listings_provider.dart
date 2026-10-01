import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/listing.dart';
import 'auth_provider.dart';

final listingsProvider = FutureProvider.autoDispose<List<Listing>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  try {
    final data = await apiService.getListings();
    return data.map((json) => Listing.fromJson(json)).toList();
  } catch (e) {
    return [];
  }
});

final listingsByCategoryProvider = FutureProvider.autoDispose.family<List<Listing>, String>(
  (ref, category) async {
    final apiService = ref.read(apiServiceProvider);
    try {
      final data = await apiService.getListings(category: category);
      return data.map((json) => Listing.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  },
);

final listingDetailProvider = FutureProvider.autoDispose.family<Listing, String>(
  (ref, id) async {
    final apiService = ref.read(apiServiceProvider);
    final data = await apiService.getListingById(id);
    return Listing.fromJson(data);
  },
);

final searchListingsProvider = FutureProvider.autoDispose.family<List<Listing>, String>(
  (ref, query) async {
    if (query.isEmpty) return [];
    final apiService = ref.read(apiServiceProvider);
    try {
      final data = await apiService.searchListings(query);
      return data.map((json) => Listing.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  },
);
