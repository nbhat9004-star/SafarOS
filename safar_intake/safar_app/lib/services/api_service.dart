import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import '../config/constants.dart';

class ApiService {
  late final Dio _dio;
  final CookieJar _cookieJar = CookieJar();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(CookieManager(_cookieJar));
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  // Auth APIs
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await _dio.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _dio.get('/auth/me');
    return response.data;
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
    await _cookieJar.deleteAll();
  }

  // Listings APIs
  Future<List<dynamic>> getListings({
    String? category,
    String? location,
    double? minPrice,
    double? maxPrice,
  }) async {
    final response = await _dio.get('/listings', queryParameters: {
      if (category != null) 'category': category,
      if (location != null) 'location': location,
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
    });
    return response.data['listings'] ?? [];
  }

  Future<Map<String, dynamic>> getListingById(String id) async {
    final response = await _dio.get('/listings/$id');
    return response.data['listing'];
  }

  Future<List<dynamic>> searchListings(String query) async {
    final response = await _dio.get('/listings/search', queryParameters: {
      'q': query,
    });
    return response.data['listings'] ?? [];
  }

  // Bookings APIs
  Future<List<dynamic>> getMyBookings() async {
    final response = await _dio.get('/bookings');
    return response.data['bookings'] ?? [];
  }

  Future<Map<String, dynamic>> createBooking({
    required String listingId,
    required String checkIn,
    required String checkOut,
    required int guests,
  }) async {
    final response = await _dio.post('/bookings', data: {
      'listingId': listingId,
      'checkIn': checkIn,
      'checkOut': checkOut,
      'guests': guests,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> cancelBooking(String id) async {
    final response = await _dio.patch('/bookings/$id', data: {
      'status': 'cancelled',
    });
    return response.data;
  }

  // AI Planner (mock for now)
  Future<Map<String, dynamic>> generateTripPlan({
    required String destination,
    required int days,
    required String interests,
  }) async {
    // Mock response since AI integration isn't in mobile scope
    await Future.delayed(const Duration(seconds: 2));
    return {
      'plan': {
        'destination': destination,
        'days': days,
        'itinerary': List.generate(days, (i) => {
          'day': i + 1,
          'activities': ['Morning activity', 'Afternoon activity', 'Evening activity'],
        }),
      },
    };
  }
}
