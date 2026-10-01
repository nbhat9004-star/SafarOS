import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/listings_provider.dart';
import '../../providers/booking_provider.dart';
import '../../widgets/safar_button.dart';
import '../../config/constants.dart';
import '../../config/theme.dart';

class BookingFlowScreen extends ConsumerStatefulWidget {
  final String listingId;

  const BookingFlowScreen({super.key, required this.listingId});

  @override
  ConsumerState<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends ConsumerState<BookingFlowScreen> {
  DateTime? checkIn;
  DateTime? checkOut;
  int guests = 2;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    // Razorpay SDK initialization removed to avoid build conflicts
    // In production, initialize Razorpay here
  }

  @override
  void dispose() {
    // Razorpay cleanup
    super.dispose();
  }

  void _handlePaymentSuccess(dynamic response) {
    _createBooking(null);
  }

  void _handlePaymentError(dynamic response) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Payment cancelled')),
    );
  }

  void _handleExternalWallet(dynamic response) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('External wallet selected')),
    );
  }

  Future<void> _createBooking(String? paymentId) async {
    if (checkIn == null || checkOut == null) return;

    setState(() => isLoading = true);

    try {
      await ref.read(bookingNotifierProvider.notifier).createBooking(
            listingId: widget.listingId,
            checkIn: checkIn!,
            checkOut: checkOut!,
            guests: guests,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully!')),
        );
        context.go('/booking-history');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _openPayment(double amount) {
    // Razorpay integration placeholder
    // In production, integrate Razorpay SDK here
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Payment'),
        content: Text('Amount: \u20b9${amount.toStringAsFixed(0)}\n\nRazorpay integration placeholder. In production, this will open the Razorpay payment gateway.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _handlePaymentSuccess(null);
            },
            child: const Text('Simulate Success'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final listingAsync = ref.watch(listingDetailProvider(widget.listingId));
    final formatter = NumberFormat.currency(symbol: '\u20b9', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(title: const Text('Book Your Stay')),
      body: listingAsync.when(
        data: (listing) {
          final nights = checkIn != null && checkOut != null
              ? checkOut!.difference(checkIn!).inDays
              : 0;
          final total = nights * listing.price;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(listing.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(listing.location, style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Check-in', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ListTile(
                  tileColor: AppTheme.surfaceColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  leading: const Icon(Icons.calendar_today),
                  title: Text(checkIn != null ? DateFormat.yMMMd().format(checkIn!) : 'Select date'),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) setState(() => checkIn = date);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Check-out', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ListTile(
                  tileColor: AppTheme.surfaceColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  leading: const Icon(Icons.calendar_today),
                  title: Text(checkOut != null ? DateFormat.yMMMd().format(checkOut!) : 'Select date'),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: checkIn ?? DateTime.now(),
                      firstDate: checkIn ?? DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) setState(() => checkOut = date);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Guests', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: guests > 1 ? () => setState(() => guests--) : null,
                    ),
                    Text('$guests', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed: () => setState(() => guests++),
                    ),
                  ],
                ),
                if (nights > 0) ...[
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${formatter.format(listing.price)} x $nights nights'),
                      Text(formatter.format(total)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(formatter.format(total), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                    ],
                  ),
                ],
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Error loading listing')),
      ),
      bottomNavigationBar: listingAsync.maybeWhen(
        data: (listing) {
          final nights = checkIn != null && checkOut != null ? checkOut!.difference(checkIn!).inDays : 0;
          final total = nights * listing.price;

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SafarButton(
                text: 'Proceed to Payment',
                onPressed: checkIn != null && checkOut != null && nights > 0
                    ? () => _openPayment(total)
                    : null,
                isLoading: isLoading,
                width: double.infinity,
              ),
            ),
          );
        },
        orElse: () => const SizedBox.shrink(),
      ),
    );
  }
}
