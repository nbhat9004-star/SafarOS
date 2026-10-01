import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

class WishlistNotifier extends StateNotifier<List<String>> {
  WishlistNotifier() : super(StorageService.getWishlist());

  void toggle(String listingId) {
    if (state.contains(listingId)) {
      StorageService.removeFromWishlist(listingId);
      state = state.where((id) => id != listingId).toList();
    } else {
      StorageService.addToWishlist(listingId);
      state = [...state, listingId];
    }
  }

  bool isInWishlist(String listingId) => state.contains(listingId);
}

final wishlistProvider = StateNotifierProvider<WishlistNotifier, List<String>>(
  (ref) => WishlistNotifier(),
);
