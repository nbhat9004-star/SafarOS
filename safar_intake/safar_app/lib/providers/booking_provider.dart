import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/booking.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

final bookingsProvider = FutureProvider.autoDispose<List<Booking>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  try {
    final data = await apiService.getMyBookings();
    return data.map((json) => Booking.fromJson(json)).toList();
  } catch (e) {
    return [];
  }
});

class BookingNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiService _apiService;
  final Ref _ref;

  BookingNotifier(this._apiService, this._ref) : super(const AsyncValue.data(null));

  Future<String> createBooking({
    required String listingId,
    required DateTime checkIn,
    required DateTime checkOut,
    required int guests,
  }) async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiService.createBooking(
        listingId: listingId,
        checkIn: checkIn.toIso8601String(),
        checkOut: checkOut.toIso8601String(),
        guests: guests,
      );
      
      state = const AsyncValue.data(null);
      _ref.invalidate(bookingsProvider);
      
      return response['booking']?['id'] ?? '';
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> cancelBooking(String id) async {
    try {
      state = const AsyncValue.loading();
      await _apiService.cancelBooking(id);
      state = const AsyncValue.data(null);
      _ref.invalidate(bookingsProvider);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final bookingNotifierProvider = StateNotifierProvider<BookingNotifier, AsyncValue<void>>(
  (ref) => BookingNotifier(ref.read(apiServiceProvider), ref),
);
