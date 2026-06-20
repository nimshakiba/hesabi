<?php
/**
 * Plugin Name: لایسنس کاربری کافه کلیک (CofeClick Licensing System)
 * Plugin URI: https://cofeclick.ir
 * Description: سیستم مدیریت لایسنس، ثبت نام کاربران، هماهنگی با نرم‌افزار حسابداری فروشگاهی، کد سیستم امن و مدیریت تاریخ انقضا.
 * Version: 1.0.0
 * Author: کافه کلیک
 * Author URI: https://cofeclick.ir
 * License: GPL2
 * Text Domain: cofeclick-licensing
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// ایجاد جدول اختصاصی در هنگام فعال‌سازی پلاگین برای ثبت نام‌ها و لایسنس‌هات رایانه
register_activation_hook(__FILE__, 'cofeclick_licensing_install');

function cofeclick_licensing_install() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cofeclick_licenses';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        fullname varchar(255) NOT NULL,
        username varchar(100) NOT NULL,
        phone varchar(20) NOT NULL,
        password_hash varchar(255) NOT NULL,
        machine_code varchar(100) NOT NULL UNIQUE,
        license_status varchar(50) DEFAULT 'pending' NOT NULL, -- pending, active, expired, blocked
        license_key varchar(100) NOT NULL,
        expiry_date datetime DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// ساخت اندپوینت REST API اختصاصی برای اپلیکیشن حسابداری
add_action('rest_api_init', function () {
    register_rest_route('cofeclick/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'cofeclick_api_register_app',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('cofeclick/v1', '/check-license', array(
        'methods' => 'POST',
        'callback' => 'cofeclick_api_check_license',
        'permission_callback' => '__return_true'
    ));
});

// کال‌بک ثبت نام کاربر جدید از اپلیکیشن
function cofeclick_api_register_app($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cofeclick_licenses';

    $params = $request->get_json_params();

    $fullname = sanitize_text_field($params['fullName']);
    $username = sanitize_text_field($params['username']);
    $phone = sanitize_text_field($params['phone']);
    $password = sanitize_text_field($params['password']);
    $machine_code = sanitize_text_field($params['machineCode']);

    if (empty($username) || empty($fullname) || empty($machine_code)) {
        return new WP_REST_Response(array('status' => 'error', 'message' => 'اطلاعات ارسالی ناقض است.'), 400);
    }

    // بررسی تکراری نبودن مکد سیستم فیزیکی
    $exists = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE machine_code = %s", $machine_code));
    
    if ($exists) {
        return new WP_REST_Response(array(
            'status' => 'exists', 
            'message' => 'این سیستم سخت‌افزاری قبلاً ثبت نام کرده است. لطفا درخواست فعالسازی لایسنس دهید.',
            'license_status' => $exists->license_status,
            'expiry_date' => $exists->expiry_date
        ), 200);
    }

    $license_key = 'CC-' . strtoupper(wp_generate_password(16, false, false));
    $hashed_password = wp_hash_password($password);

    // پیشفرض به هر ثبت نام یک دوره آزمایشی ۷ روزه میدهیم تا مدیر تایید کند
    $expiry_date = date('Y-m-d H:i:s', strtotime('+7 days'));

    $result = $wpdb->insert($table_name, array(
        'fullname' => $fullname,
        'username' => $username,
        'phone' => $phone,
        'password_hash' => $hashed_password,
        'machine_code' => $machine_code,
        'license_status' => 'pending', // نیاز به تایید مدیر سایت دارد
        'license_key' => $license_key,
        'expiry_date' => $expiry_date,
    ));

    if ($result) {
        return new WP_REST_Response(array(
            'status' => 'success',
            'message' => 'ثبت نام با موفقیت انجام شد. منتظر تایید و فعالسازی نهایی لایسنس توسط مدیریت بمانید.',
            'license_key' => $license_key,
            'license_status' => 'pending',
            'expiry_date' => $expiry_date
        ), 200);
    }

    return new WP_REST_Response(array('status' => 'error', 'message' => 'خطا در ذخیره‌سازی اطلاعات داخل پایگاه وردپرس.'), 500);
}

// کال‌بک بررسی دوره ای وضعیت لایسنس
function cofeclick_api_check_license($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cofeclick_licenses';
    $params = $request->get_json_params();
    $machine_code = sanitize_text_field($params['machineCode']);

    if (empty($machine_code)) {
        return new WP_REST_Response(array('status' => 'error', 'message' => 'دریافت کد سیستم ناموفق بود.'), 400);
    }

    $client = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE machine_code = %s", $machine_code));

    if (!$client) {
        return new WP_REST_Response(array('status' => 'not_registered', 'message' => 'دستگاه ثبت نشده است.'), 200);
    }

    // مقایسه زمان حال با انقضای لایسنس
    $current_time = current_time('mysql');
    $status = $client->license_status;

    if ($status === 'active' && $client->expiry_date < $current_time) {
        $status = 'expired';
        $wpdb->update($table_name, array('license_status' => 'expired'), array('id' => $client->id));
    }

    return new WP_REST_Response(array(
        'status' => 'success',
        'license_status' => $status,
        'expiry_date' => $client->expiry_date,
        'fullname' => $client->fullname,
        'username' => $client->username,
        'license_key' => $client->license_key
    ), 200);
}

// طراحی پنل ادمین ویژه در وردپرس جهت مدیریت، فعال‌سازی، تمدید و بلاک سیستم‌های حسابداری بازار یاب
add_action('admin_menu', 'cofeclick_licensing_menu');

function cofeclick_licensing_menu() {
    add_menu_page(
        'مدیریت لایسنس شتاب',
        'لایسنس کافه کلیک',
        'manage_options',
        'cofeclick-licensing',
        'cofeclick_licensing_admin_page',
        'dashicons-shield',
        81
    );
}

function cofeclick_licensing_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cofeclick_licenses';

    // عملیات تغییر وضعیت لایسنس توسط مدیر وردپرس
    if (isset($_GET['action']) && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $action = sanitize_text_field($_GET['action']);

        if ($action === 'activate') {
            $months = isset($_POST['period_months']) ? intval($_POST['period_months']) : 12;
            $expiry = date('Y-m-d H:i:s', strtotime("+$months months"));
            $wpdb->update($table_name, array('license_status' => 'active', 'expiry_date' => $expiry), array('id' => $id));
            echo '<div class="notice notice-success is-dismissible"><p>لایسنس با موفقیت برای ' . $months . ' ماه تمدید و فعال گردید.</p></div>';
        } elseif ($action === 'block') {
            $wpdb->update($table_name, array('license_status' => 'blocked'), array('id' => $id));
            echo '<div class="notice notice-warning is-dismissible"><p>دستگاه مورد نظر مسدود و دسترسی آن قطع گردید.</p></div>';
        } elseif ($action === 'delete') {
            $wpdb->delete($table_name, array('id' => $id));
            echo '<div class="notice notice-error is-dismissible"><p>ریشه ثبت نام دستگاه از پایگاه داده وردپرس حذف شد.</p></div>';
        }
    }

    $licenses = $wpdb->get_results("SELECT * FROM $table_name ORDER BY id DESC");
    ?>
    <style>
        .cc-wrap { direction: rtl; font-family: Tahoma, sans-serif; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 20px; max-width: 98%; }
        .cc-header { background: #1e1e2d; color: #fff; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .cc-header h1 { color: #f89c0e !important; margin: 0 0 8px 0; font-size: 22px; font-weight: bold; }
        .cc-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .cc-table th, .cc-table td { padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-size: 13px; }
        .cc-table th { background: #edf2f7; font-weight: bold; }
        .cc-status { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
        .status-active { bg: #d4edda; color: #155724; background: #d4edda; }
        .status-pending { bg: #fff3cd; color: #856404; background: #fff3cd; }
        .status-expired { bg: #f8d7da; color: #721c24; background: #f8d7da; }
        .status-blocked { bg: #e2e3e5; color: #383d41; background: #e2e3e5; }
        .cc-action-btn { text-decoration: none; padding: 5px 10px; font-size: 11px; margin-left: 5px; border-radius: 4px; display: inline-block; color: white !important; font-weight: bold; }
        .btn-act { background: #28a745; }
        .btn-blk { background: #fd7e14; }
        .btn-del { background: #dc3545; }
        .cc-date { font-family: monospace; font-size: 12px; }
        form.act-form { display: inline-block; margin: 0; }
        form.act-form select { font-size: 11px; height: 26px; padding: 2px; }
    </style>

    <div class="cc-wrap">
        <div class="cc-header">
            <h1>درگاه مدیریت لایسنس و سخت‌افزارهای کافه کلیک</h1>
            <p>این افزونه مسئول مستقیم تصدیق هویت کاربران نرم‌افزار فروشگاهی حسابداری شما و کنترل دستگاه‌های فعال است.</p>
        </div>

        <h2>لیست دستگاه‌ها و لایسنس‌ها</h2>
        <table class="cc-table">
            <thead>
                <tr>
                    <th>کد ردیف</th>
                    <th>نام مشتری / پورتال</th>
                    <th>نام کاربری ارشد</th>
                    <th>شماره تماس</th>
                    <th>کد سخت‌افزاری کامپیوتر</th>
                    <th>کلید لایسنس فیزیکی</th>
                    <th>وضعیت فعلی</th>
                    <th>تاریخ انقضای اشتراک</th>
                    <th>تاریخ ثبت نام</th>
                    <th>عملیات و تمدید دوره</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($licenses)) : ?>
                    <tr>
                        <td colspan="10" style="text-align: center; color: #888;">هنوز هیچ کاربری از طریق نرم‌افزار ثبت نام نکرده است.</td>
                    </tr>
                <?php else : ?>
                    <?php foreach ($licenses as $row) : ?>
                        <tr>
                            <td><?php echo $row->id; ?></td>
                            <td><strong><?php echo esc_html($row->fullname); ?></strong></td>
                            <td><code><?php echo esc_html($row->username); ?></code></td>
                            <td><?php echo esc_html($row->phone); ?></td>
                            <td><code style="background: #f1f1f1; padding: 3px; font-size: 11px;"><?php echo esc_html($row->machine_code); ?></code></td>
                            <td><code style="color: #0073aa;"><?php echo esc_html($row->license_key); ?></code></td>
                            <td>
                                <span class="cc-status status-<?php echo $row->license_status; ?>">
                                    <?php 
                                        if($row->license_status == 'active') echo 'فعال شده';
                                        elseif($row->license_status == 'pending') echo 'در انتظار تایید';
                                        elseif($row->license_status == 'expired') echo 'منقضی شده';
                                        elseif($row->license_status == 'blocked') echo 'مسدود شده';
                                    ?>
                                </span>
                            </td>
                            <td class="cc-date"><?php echo $row->expiry_date ? $row->expiry_date : 'بدون انقضا'; ?></td>
                            <td class="cc-date"><?php echo $row->created_at; ?></td>
                            <td>
                                <form method="post" action="?page=cofeclick-licensing&action=activate&id=<?php echo $row->id; ?>" class="act-form">
                                    <select name="period_months">
                                        <option value="1">دوره آزمایشی (۱ ماهه)</option>
                                        <option value="3">اشتراک میان‌مدت (۳ ماهه)</option>
                                        <option value="6">اشتراک میان‌مدت (۶ ماهه)</option>
                                        <option value="12" selected>اشتراک طلایی (۱ ساله)</option>
                                        <option value="36">اشتراک بلندمدت (۳ ساله)</option>
                                    </select>
                                    <button type="submit" class="cc-action-btn btn-act">تایید و فعال‌سازی</button>
                                </form>
                                <a href="?page=cofeclick-licensing&action=block&id=<?php echo $row->id; ?>" class="cc-action-btn btn-blk" onclick="return confirm('آیا از مسدودسازی این رایانه مطمئن هستید؟')">قطع دسترسی</a>
                                <a href="?page=cofeclick-licensing&action=delete&id=<?php echo $row->id; ?>" class="cc-action-btn btn-del" onclick="return confirm('آیا مایل به حذف کل تاریخچه این کاربر هستید؟')">حذف کل</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}
